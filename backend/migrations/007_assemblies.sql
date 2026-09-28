-- Assemblies: parts that contain other parts.
--
-- A battery, alternator or control module is a sealed case with components
-- inside. A tag on the case proves the case is genuine and says nothing about
-- its contents, so a workshop can open it, swap the internals and close it
-- again with the tag still reading as authentic.
--
-- Two defences are recorded here. The seal position tells the operator to
-- apply the tag across the opening, so opening the case destroys the antenna.
-- The parent link records which components belong inside which assembly, and
-- that link is written into each passport on-chain — so a buyer can check the
-- contents without trusting our database at all.

CREATE TYPE seal_position AS ENUM ('surface', 'across_opening');

ALTER TABLE parts
    ADD COLUMN parent_part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
    ADD COLUMN seal_position seal_position NOT NULL DEFAULT 'surface',
    ADD COLUMN component_role TEXT;

CREATE INDEX idx_parts_parent ON parts(parent_part_id)
    WHERE parent_part_id IS NOT NULL;

-- A part cannot contain itself.
ALTER TABLE parts
    ADD CONSTRAINT parts_no_self_parent CHECK (parent_part_id IS NULL OR parent_part_id <> id);

-- Products declare whether they are assemblies and what must be inside them,
-- so provisioning can refuse an assembly with missing components rather than
-- discovering it later.
ALTER TABLE products
    ADD COLUMN is_assembly BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE product_components (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, role)
);

CREATE INDEX idx_product_components_product ON product_components(product_id);
