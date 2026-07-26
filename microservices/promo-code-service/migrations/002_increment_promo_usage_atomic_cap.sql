-- 002_increment_promo_usage_atomic_cap.sql
-- The original increment_promo_usage() blindly incremented times_used with
-- no check against max_uses, so concurrent checkouts could push a promo
-- code's usage past its cap (increment was atomic, but "check cap, then
-- increment" as two separate steps was not). This version folds the cap
-- check into the same UPDATE's WHERE clause, so the check-and-increment
-- happens under one row lock — no race window. Returns whether the
-- increment actually happened (false = code not found, or cap reached).
--
-- Instructions: Run this script in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code_text TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows INT;
BEGIN
  UPDATE promo_codes
  SET times_used = COALESCE(times_used, 0) + 1
  WHERE code = promo_code_text
    AND (max_uses IS NULL OR COALESCE(times_used, 0) < max_uses);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;
