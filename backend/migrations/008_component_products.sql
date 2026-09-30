-- Which product fills each slot of an assembly.
--
-- 007 said a Battery Pack BT-90 must contain a "cell" and a "controller". It
-- did not say which product a cell is, so any tag could be attached into any
-- role: a controller could be recorded as the cell and the system would agree.
--
-- Naming the product per slot closes that, and answers a second question the
-- system could not answer before: whether a given product is a component of
-- something. That decides when its passport is minted. A component's link to
-- its assembly is written into the passport itself, so its passport cannot be
-- minted at provisioning time — there is no parent yet. It is minted when the
-- component is attached, with the parent inside it, and is never rewritten.
--
-- Nullable on purpose. A maker declares the slots of an assembly before the
-- component products exist in the catalogue, and existing rows predate this
-- column. A slot with no product named accepts nothing: the refusal lives in
-- the service, where it can say why, not in a constraint that would block the
-- declaration itself.

ALTER TABLE product_components
    ADD COLUMN component_product_id UUID REFERENCES products(id) ON DELETE RESTRICT;

-- Lookup runs the other way at provisioning time: given a product, is it a
-- component of anything? Without this that check is a sequential scan on
-- every tag written.
CREATE INDEX idx_product_components_component
    ON product_components(component_product_id)
    WHERE component_product_id IS NOT NULL;

-- A product cannot be a component of itself.
ALTER TABLE product_components
    ADD CONSTRAINT product_components_no_self
    CHECK (component_product_id IS NULL OR component_product_id <> product_id);
