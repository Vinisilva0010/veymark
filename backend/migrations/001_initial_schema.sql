-- Veymark initial schema.
--
-- Design notes:
--   * SDM keys are stored encrypted, never in plaintext. The application
--     encrypts before insert; the database never sees the raw key.
--   * chip_uid is unique because one physical tag maps to exactly one part.
--   * last_counter enforces replay protection: a tap whose counter is not
--     strictly greater than the stored value is rejected.

CREATE TABLE manufacturers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    wallet_pubkey   TEXT NOT NULL UNIQUE,
    verified_onchain BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    model           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (manufacturer_id, model)
);

CREATE TYPE part_status AS ENUM ('active', 'damaged_tag', 'flagged', 'retired');

CREATE TABLE parts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    chip_uid          TEXT NOT NULL UNIQUE,
    sdm_key_encrypted BYTEA NOT NULL,
    asset_id          TEXT UNIQUE,
    batch             TEXT NOT NULL,
    status            part_status NOT NULL DEFAULT 'active',
    last_counter      BIGINT NOT NULL DEFAULT 0,
    provisioned_by    TEXT NOT NULL,
    provisioned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_product ON parts(product_id);
CREATE INDEX idx_parts_batch ON parts(batch);

CREATE TYPE verification_result AS ENUM ('authentic', 'unverified', 'alert');

CREATE TABLE verifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id       UUID REFERENCES parts(id) ON DELETE SET NULL,
    chip_uid      TEXT NOT NULL,
    result        verification_result NOT NULL,
    counter_value BIGINT,
    geo_country   TEXT,
    geo_region    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_part ON verifications(part_id, created_at DESC);
CREATE INDEX idx_verifications_chip ON verifications(chip_uid, created_at DESC);
