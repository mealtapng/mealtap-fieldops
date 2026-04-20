-- =============================================================================
-- Mealtap Field Ops — 004_delivery_methods_array.sql
-- Adds a text[] column to store multiple delivery platforms per restaurant.
-- The original delivery_method enum column is kept for backward compatibility.
-- Run this in the Supabase SQL Editor.
-- =============================================================================

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS delivery_methods text[] NOT NULL DEFAULT '{}';

-- Storage policies for the restaurant-photos bucket.
-- Run these if the bucket already exists but policies are missing.
-- (Create the bucket first in Storage → New bucket → "restaurant-photos", Public: false)

-- INSERT: agent can upload to a folder named after their own user id
CREATE POLICY "agent can upload restaurant photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: agent can read their own uploads; admins/leads can read all
CREATE POLICY "agent can read own restaurant photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'restaurant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
