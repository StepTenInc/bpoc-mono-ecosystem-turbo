-- ============================================
-- DROP OLD OUTBOUND SYSTEM
-- Date: 2026-01-24
-- Purpose: Remove OLD email/contact system (replaced by Carpet Bomb)
-- ============================================

-- These tables are no longer used:
-- - OLD outbound system → NEW Carpet Bomb system
-- - link_suggestions → Automated linking in Stage 6

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  DROPPING OLD OUTBOUND SYSTEM';
  RAISE NOTICE '========================================';
END $$;

-- Drop tables in correct order (respecting foreign keys)

-- 1. Email Activity Log
DROP TABLE IF EXISTS email_activity_log CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_activity_log') THEN
    RAISE NOTICE '✅ Dropped: email_activity_log';
  END IF;
END $$;

-- 2. Campaign Recipients
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'campaign_recipients') THEN
    RAISE NOTICE '✅ Dropped: campaign_recipients';
  END IF;
END $$;

-- 3. Email Campaigns
DROP TABLE IF EXISTS email_campaigns CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_campaigns') THEN
    RAISE NOTICE '✅ Dropped: email_campaigns';
  END IF;
END $$;

-- 4. CSV Import Batches
DROP TABLE IF EXISTS csv_import_batches CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'csv_import_batches') THEN
    RAISE NOTICE '✅ Dropped: csv_import_batches';
  END IF;
END $$;

-- 5. Outbound Contacts
DROP TABLE IF EXISTS outbound_contacts CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'outbound_contacts') THEN
    RAISE NOTICE '✅ Dropped: outbound_contacts';
  END IF;
END $$;

-- 6. Link Suggestions (replaced by automated Stage 6 linking)
DROP TABLE IF EXISTS link_suggestions CASCADE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'link_suggestions') THEN
    RAISE NOTICE '✅ Dropped: link_suggestions';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Verify all tables are gone
DO $$
DECLARE
  remaining_tables TEXT;
BEGIN
  SELECT string_agg(tablename, ', ') INTO remaining_tables
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN (
      'email_activity_log',
      'campaign_recipients',
      'email_campaigns',
      'csv_import_batches',
      'outbound_contacts',
      'link_suggestions'
    );
  
  IF remaining_tables IS NULL THEN
    RAISE NOTICE '✅ SUCCESS: All OLD tables successfully dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Dropped tables:';
    RAISE NOTICE '  - email_activity_log';
    RAISE NOTICE '  - campaign_recipients';
    RAISE NOTICE '  - email_campaigns';
    RAISE NOTICE '  - csv_import_batches';
    RAISE NOTICE '  - outbound_contacts';
    RAISE NOTICE '  - link_suggestions';
  ELSE
    RAISE WARNING '⚠️  WARNING: These tables still exist: %', remaining_tables;
    RAISE WARNING '⚠️  Check for foreign key dependencies';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ OLD OUTBOUND SYSTEM CLEANUP COMPLETE';
  RAISE NOTICE '========================================';
END $$;
