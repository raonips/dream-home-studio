-- 1. Add region_slug column (default to existing region for backfill)
ALTER TABLE public.tides_cache
  ADD COLUMN IF NOT EXISTS region_slug TEXT NOT NULL DEFAULT 'barra-do-jacuipe';

-- 2. Drop old unique constraint on date_string (and PK if it was on date_string)
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.tides_cache'::regclass
      AND contype IN ('u', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.tides_cache DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

-- 3. New composite unique constraint
ALTER TABLE public.tides_cache
  ADD CONSTRAINT tides_cache_region_date_unique UNIQUE (region_slug, date_string);