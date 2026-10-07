-- Manufacturers asking for access.
--
-- The form is aimed at one reader: someone who makes parts and has a
-- counterfeiting problem. A generic mailing list would fill up with people
-- who are curious about the technology and can never buy it, and counting
-- those as demand would be lying to ourselves.
--
-- What they write here is their own account of the problem, in their words.
-- That is the thing worth keeping; the email is only how we reach them.

CREATE TABLE manufacturer_interest (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company       TEXT NOT NULL,
    contact_name  TEXT NOT NULL,
    email         TEXT NOT NULL,
    parts_made    TEXT NOT NULL,
    problem       TEXT,
    source_ip     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting reads by IP and time, the same shape the demo already uses.
CREATE INDEX idx_manufacturer_interest_ip
    ON manufacturer_interest(source_ip, created_at DESC);

CREATE INDEX idx_manufacturer_interest_time
    ON manufacturer_interest(created_at DESC);
