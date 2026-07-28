-- Refactor commission model:
-- 1) Convert legacy "is_new_racket=true" into explicit "record_type='sale'" rows
-- 2) Remove legacy is_new_racket column
-- 3) Enforce new type/price constraints

BEGIN;

-- Ensure record_type exists for old rows
UPDATE records
SET record_type = 'string'
WHERE record_type IS NULL OR record_type = '';

-- Create explicit sale records from legacy flags (only if legacy column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'records' AND column_name = 'is_new_racket'
  ) THEN
    INSERT INTO records (
      user_id,
      date,
      seq,
      record_type,
      racket,
      string1,
      string2,
      price,
      note
    )
    SELECT
      l.user_id,
      l.date,
      m.max_seq + l.rn,
      'sale',
      '',
      '',
      '',
      200,
      ''
    FROM (
      SELECT
        user_id,
        date,
        ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY seq, created_at, id) AS rn
      FROM records
      WHERE record_type = 'string' AND is_new_racket = true
    ) l
    JOIN (
      SELECT user_id, date, COALESCE(MAX(seq), 0) AS max_seq
      FROM records
      GROUP BY user_id, date
    ) m ON m.user_id = l.user_id AND m.date = l.date;
  END IF;
END $$;

-- Remove old constraint names and apply new ones
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_price_check;
ALTER TABLE records ADD CONSTRAINT records_price_check
  CHECK (
    (record_type = 'string' AND price IN (200, 300)) OR
    (record_type = 'sale'   AND price IN (200, 500)) OR
    (record_type IN ('demo', 'grip', 'other') AND price > 0)
  );

ALTER TABLE records DROP CONSTRAINT IF EXISTS records_type_check;
ALTER TABLE records ADD CONSTRAINT records_type_check
  CHECK (record_type IN ('string', 'sale', 'demo', 'grip', 'other'));

-- Drop legacy columns
ALTER TABLE records DROP COLUMN IF EXISTS is_new_racket;
ALTER TABLE records DROP COLUMN IF EXISTS type;

COMMIT;

