-- ============================================
-- ARCHIVE GAME TABLES MIGRATION
-- ============================================
-- Date: 2026-01-22
-- Purpose: Archive all game-related tables to separate schema
-- Strategy: Move tables to archived_games schema (preserves data)
--
-- This migration:
-- 1. Creates archived_games schema
-- 2. Moves game assessment tables
-- 3. Drops game-related indexes from public schema
-- 4. Preserves all data for potential future use
-- ============================================

BEGIN;

-- Step 1: Create archived schema
CREATE SCHEMA IF NOT EXISTS archived_games;

-- Step 2: Move game assessment tables (preserves data)
ALTER TABLE IF EXISTS public.candidate_typing_assessments 
  SET SCHEMA archived_games;

ALTER TABLE IF EXISTS public.candidate_disc_assessments 
  SET SCHEMA archived_games;

ALTER TABLE IF EXISTS public.candidate_cultural_assessments 
  SET SCHEMA archived_games;

ALTER TABLE IF EXISTS public.candidate_ultimate_assessments 
  SET SCHEMA archived_games;

-- Step 3: Drop game-related indexes from public schema
-- (These will fail if tables already moved, which is fine)
DROP INDEX IF EXISTS public.idx_candidate_disc_assessments_candidate_finished;
DROP INDEX IF EXISTS public.idx_candidate_disc_assessments_candidate_completed;
DROP INDEX IF EXISTS public.idx_candidate_disc_assessments_candidate_created;
DROP INDEX IF EXISTS public.idx_candidate_typing_assessments_candidate_finished;
DROP INDEX IF EXISTS public.idx_candidate_typing_assessments_candidate_completed;
DROP INDEX IF EXISTS public.idx_candidate_typing_assessments_candidate_created;

-- Step 4: Drop game-related responses table if it exists
ALTER TABLE IF EXISTS public.candidate_disc_responses 
  SET SCHEMA archived_games;

COMMIT;

-- ============================================
-- NOTES FOR FUTURE:
-- ============================================
-- To restore a table:
--   ALTER TABLE archived_games.candidate_typing_assessments SET SCHEMA public;
--
-- To permanently delete (DANGEROUS):
--   DROP SCHEMA archived_games CASCADE;
--
-- To query archived data:
--   SELECT * FROM archived_games.candidate_typing_assessments;
-- ============================================
