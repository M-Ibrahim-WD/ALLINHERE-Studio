-- ALLINHERE Studio Migration
-- This migration adds a `file_path` column to the `media_assets` table
-- and makes the `file_url` column nullable to support private storage.

-- ============================================================================
-- 1. ADD `file_path` COLUMN TO `media_assets`
-- ============================================================================

ALTER TABLE public.media_assets
ADD COLUMN file_path TEXT;

-- ============================================================================
-- 2. MAKE `file_url` COLUMN NULLABLE
-- ============================================================================

ALTER TABLE public.media_assets
ALTER COLUMN file_url DROP NOT NULL;
