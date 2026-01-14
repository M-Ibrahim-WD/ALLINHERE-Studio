-- ALLINHERE Studio Storage Setup Migration
-- This migration creates storage buckets and RLS policies for user media.

-- ============================================================================
-- 1. STORAGE BUCKET CREATION
-- ============================================================================

-- Create media bucket (private)
-- Stores user-uploaded original video, image, and audio files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Create thumbnails bucket (public)
-- Stores auto-generated thumbnails for media assets. Public for easy access.
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create exports bucket (private)
-- Stores exported video projects. Private to the user.
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (public)
-- Stores user profile avatars. Public for easy access in the app.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE RLS POLICIES (for private buckets)
-- ============================================================================

-- Note: Supabase Storage RLS is based on policies on the `storage.objects` table.
-- The policies below isolate user files into folders named with their user_id.
-- Example path: `media/{user_id}/timestamp_filename.mp4`

-- ----------------------------------------------------------------------------
-- Policies for 'media' bucket
-- ----------------------------------------------------------------------------

-- Allow users to view their own media files.
CREATE POLICY "Users can view own media files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload media files into their own folder.
-- (storage.foldername(name))[1] extracts the first folder name, which is the user_id.
CREATE POLICY "Users can upload to their own media folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media files.
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ----------------------------------------------------------------------------
-- Policies for 'exports' bucket
-- ----------------------------------------------------------------------------

-- Allow users to view their own exported files.
CREATE POLICY "Users can view own export files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload (create) exported files in their own folder.
CREATE POLICY "Users can upload to their own export folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own exported files.
CREATE POLICY "Users can delete their own export files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 3. PUBLIC BUCKETS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Policies for 'avatars' bucket (public)
-- ----------------------------------------------------------------------------

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar.
-- The path will be `{user_id}/avatar.png`.
CREATE POLICY "Authenticated users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar.
CREATE POLICY "Authenticated users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
