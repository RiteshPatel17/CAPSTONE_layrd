-- ==============================================================================
-- Migration: Add updated_at to ai_label_requests
-- Description: Tracks when an admin approves, rejects, or requests a revision 
--              on an AI label request.
-- ==============================================================================

ALTER TABLE ai_label_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
