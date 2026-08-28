-- stringer-tracker — Final Database Schema
-- Run: psql "$DATABASE_URL" -f migrations/001_final_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(50)      UNIQUE NOT NULL,
  password   VARCHAR(255)     NOT NULL,           -- bcrypt hashed
  name       VARCHAR(100)     NOT NULL,
  role       user_role_enum   NOT NULL DEFAULT 'user'::user_role_enum,
  is_active  BOOLEAN          DEFAULT true,
  is_deleted BOOLEAN          DEFAULT false,      -- soft delete support
  created_at TIMESTAMPTZ      DEFAULT now(),
  updated_at TIMESTAMPTZ      DEFAULT now()
);

-- ─── Records ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS records (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date           DATE         NOT NULL,
  seq            INTEGER      NOT NULL,
  record_type    VARCHAR(20)  NOT NULL DEFAULT 'string', -- string | sale | demo | grip | other
  racket         VARCHAR(200) NOT NULL,
  string1        VARCHAR(200) DEFAULT '',
  string2        VARCHAR(200) DEFAULT '',
  price          INTEGER      NOT NULL,
  note           TEXT         DEFAULT '',
  created_at     TIMESTAMPTZ  DEFAULT now(),
  updated_at     TIMESTAMPTZ  DEFAULT now()
);

-- Price constraint by record_type
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_price_check;
ALTER TABLE records ADD CONSTRAINT records_price_check
  CHECK (
    (record_type = 'string' AND price IN (200, 300)) OR
    (record_type = 'sale'   AND price IN (200, 500)) OR
    (record_type IN ('demo', 'grip', 'other') AND price > 0)
  );

-- Record type validation
DO $$
BEGIN
  BEGIN
    ALTER TABLE records ADD CONSTRAINT records_type_check
      CHECK (record_type IN ('string', 'sale', 'demo', 'grip', 'other'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_records_user_date ON records (user_id, date);
CREATE INDEX IF NOT EXISTS idx_records_date      ON records (date);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at   ON users;
DROP TRIGGER IF EXISTS trg_records_updated_at ON records;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── View for active users (excludes soft-deleted) ───────────────────────────

CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE is_deleted = false;

-- ─── NOTE ────────────────────────────────────────────────────────────────────
-- Admin user is created by running: task seed
-- (cmd/seed/main.go — generates bcrypt hash at runtime)
