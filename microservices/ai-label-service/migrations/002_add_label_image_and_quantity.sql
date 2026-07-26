-- ==============================================================================
-- Migration: Add label image + print quantity to ai_label_requests
-- Description: Stores the path to the final generated label picture in Supabase
--              Storage, and how many physical labels are needed for printing.
-- ==============================================================================

ALTER TABLE ai_label_requests
ADD COLUMN IF NOT EXISTS label_image_path TEXT;

ALTER TABLE ai_label_requests
ADD COLUMN IF NOT EXISTS quantity INTEGER;