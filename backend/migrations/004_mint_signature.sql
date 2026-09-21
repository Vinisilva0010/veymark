-- Stores the transaction that minted each passport.
--
-- A compressed NFT is not an account: its asset id is a derived identifier, so
-- explorers that look it up as an address show an empty page. The mint
-- transaction, on the other hand, is a real on-chain object that every
-- explorer renders, with the Bubblegum instruction and the part metadata in
-- it. That is what the verification page links to as public proof.
ALTER TABLE parts ADD COLUMN mint_signature TEXT;
