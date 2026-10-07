-- Two ways in, one table.
--
-- A waitlist signup is an email and nothing else: someone who saw the site
-- and wants to hear when it ships. A manufacturer enquiry is the one that
-- carries weight — what they make, and whether copies of their own parts have
-- come back to them.
--
-- Both are kept here because they are the same question at different depths,
-- and counting them together would hide the difference. The kind column is
-- what keeps them apart.

CREATE TYPE interest_kind AS ENUM ('waitlist', 'manufacturer');

ALTER TABLE manufacturer_interest
    ADD COLUMN kind interest_kind NOT NULL DEFAULT 'manufacturer',
    ALTER COLUMN company DROP NOT NULL,
    ALTER COLUMN contact_name DROP NOT NULL,
    ALTER COLUMN parts_made DROP NOT NULL;

-- A manufacturer enquiry without a company is an incomplete record, so the
-- requirement moves from the column to the kind.
ALTER TABLE manufacturer_interest
    ADD CONSTRAINT manufacturer_interest_complete
    CHECK (
      kind = 'waitlist'
      OR (company IS NOT NULL AND contact_name IS NOT NULL AND parts_made IS NOT NULL)
    );

-- The same address should not sit in the list twice.
CREATE UNIQUE INDEX idx_manufacturer_interest_email
    ON manufacturer_interest(lower(email), kind);
