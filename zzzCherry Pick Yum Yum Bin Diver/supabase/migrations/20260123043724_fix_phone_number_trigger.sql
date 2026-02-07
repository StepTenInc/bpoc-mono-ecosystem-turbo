-- Fix any triggers or functions still referencing phone_number column
-- The candidates table uses 'phone' not 'phone_number'

-- Drop and recreate any triggers that might be referencing phone_number
-- This is a safety migration to ensure old column references are removed

-- First, let's check if there are any functions using phone_number in candidates context
-- and replace them

-- Update full_name generation function if it exists
CREATE OR REPLACE FUNCTION public.update_candidate_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger uses the correct function
DROP TRIGGER IF EXISTS set_candidate_full_name ON public.candidates;
CREATE TRIGGER set_candidate_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_candidate_full_name();

-- Ensure slug generation doesn't reference phone_number
CREATE OR REPLACE FUNCTION public.generate_candidate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(CONCAT(COALESCE(NEW.first_name, ''), '-', COALESCE(NEW.last_name, ''))),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    
    -- Add random suffix if slug exists
    IF EXISTS (SELECT 1 FROM candidates WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_candidate_slug ON public.candidates;
CREATE TRIGGER set_candidate_slug
  BEFORE INSERT OR UPDATE OF first_name, last_name, slug
  ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_candidate_slug();

-- Add a comment to document the fix
COMMENT ON TABLE public.candidates IS 'Candidates table - uses phone column (not phone_number)';
