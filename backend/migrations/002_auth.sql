-- Authentication for the manufacturer panel.
--
-- Sessions are opaque tokens stored server-side rather than JWTs, because the
-- panel controls provisioning: whoever holds a valid session can mint part
-- passports. Revocation has to be immediate, so a compromised account is cut
-- off by deleting a row instead of waiting for a token to expire.
--
-- Only the SHA-256 hash of the session token is stored. A database dump does
-- not hand over usable session tokens.

CREATE TABLE manufacturer_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_manufacturer ON manufacturer_users(manufacturer_id);

CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES manufacturer_users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent  TEXT,
    ip_address  INET
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

-- provisioned_by on parts references a user, giving per-operator traceability
-- instead of a shared account. This is what makes an insider action auditable.
ALTER TABLE parts
    ADD COLUMN provisioned_by_user_id UUID REFERENCES manufacturer_users(id);
