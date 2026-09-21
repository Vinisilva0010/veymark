-- Marks parts that the public test bench is allowed to generate taps for.
--
-- The bench produces valid SUN payloads server-side so a judge can test
-- without a physical tag. Doing that for any part would let anyone mint an
-- authentic tap for any real product — the exact attack the system exists to
-- stop. Only parts flagged here are eligible, and they carry a demo batch so
-- they are never mistaken for production stock.
ALTER TABLE parts ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_parts_demo ON parts(is_demo) WHERE is_demo = TRUE;
