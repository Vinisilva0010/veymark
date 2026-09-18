-- Provisioning state tracking.
--
-- The provisioning flow writes the part row first with a null asset_id, then
-- mints the on-chain passport, then fills asset_id in. The order matters: in a
-- factory the tag is applied to the part at the moment it is written, so a
-- failure that leaves nothing in the database would put a physical tag in the
-- world that the system does not recognise — that genuine part would verify as
-- "could not verify" forever.
--
-- A row with mint_status 'pending' is a part that exists and is verifiable by
-- chip, awaiting its passport. A retry job picks these up.

CREATE TYPE mint_status AS ENUM ('pending', 'minted', 'failed');

ALTER TABLE parts
    ADD COLUMN mint_status mint_status NOT NULL DEFAULT 'pending',
    ADD COLUMN mint_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN mint_last_error TEXT,
    ADD COLUMN mint_last_attempt_at TIMESTAMPTZ;

-- Existing rows were provisioned before this migration; those with an asset
-- already recorded are minted.
UPDATE parts SET mint_status = 'minted' WHERE asset_id IS NOT NULL;

CREATE INDEX idx_parts_mint_pending
    ON parts(mint_status, mint_last_attempt_at)
    WHERE mint_status <> 'minted';
