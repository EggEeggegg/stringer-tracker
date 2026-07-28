-- Unify to single record_type enum:
-- 1) Map legacy activity_name values into record_type (demo/grip/other)
-- 2) Move leftover activity_name text into note
-- 3) Drop activity_name
-- 4) Enforce expanded type/price constraints

BEGIN;

-- Drop old checks before remapping types they disallow
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_price_check;
ALTER TABLE records DROP CONSTRAINT IF EXISTS records_type_check;

-- Map known activity names to dedicated record types (only if column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'records' AND column_name = 'activity_name'
  ) THEN
    UPDATE records
    SET record_type = 'demo'
    WHERE record_type = 'other'
      AND activity_name = 'ค่าบริการ Demo ไม้เทนนิส';

    UPDATE records
    SET record_type = 'grip'
    WHERE record_type = 'other'
      AND activity_name = 'พัน Grip';

    -- Preserve unknown activity labels in note before dropping the column
    UPDATE records
    SET note = CASE
      WHEN note IS NULL OR note = '' THEN activity_name
      ELSE activity_name || ' — ' || note
    END
    WHERE record_type = 'other'
      AND activity_name IS NOT NULL
      AND activity_name <> ''
      AND activity_name NOT IN ('ค่าบริการ Demo ไม้เทนนิส', 'พัน Grip', 'อื่นๆ');
  END IF;
END $$;

ALTER TABLE records ADD CONSTRAINT records_price_check
  CHECK (
    (record_type = 'string' AND price IN (200, 300)) OR
    (record_type = 'sale'   AND price IN (200, 500)) OR
    (record_type IN ('demo', 'grip', 'other') AND price > 0)
  );

ALTER TABLE records ADD CONSTRAINT records_type_check
  CHECK (record_type IN ('string', 'sale', 'demo', 'grip', 'other'));

ALTER TABLE records DROP COLUMN IF EXISTS activity_name;

COMMIT;
