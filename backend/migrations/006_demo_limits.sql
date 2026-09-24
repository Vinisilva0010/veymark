-- Rate limiting for the public demo.
--
-- The demo lets an anonymous visitor mint a passport on-chain. Without a cap,
-- one script could fill the demo Merkle tree (capacity is fixed at creation
-- and cannot be raised) or drain the devnet wallet that pays for mints.
--
-- Two independent caps: per visitor, and a global daily ceiling. The global
-- one matters most — it holds even if someone rotates addresses.

CREATE TABLE demo_mints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_key TEXT NOT NULL,
    part_id     UUID REFERENCES parts(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demo_mints_visitor ON demo_mints(visitor_key, created_at DESC);
CREATE INDEX idx_demo_mints_time ON demo_mints(created_at DESC);
