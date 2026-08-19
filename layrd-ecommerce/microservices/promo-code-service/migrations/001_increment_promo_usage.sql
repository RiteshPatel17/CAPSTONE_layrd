-- 001_increment_promo_usage.sql
-- This migration creates a Postgres RPC function to atomically increment the `times_used`
-- of a promo code to prevent race conditions during simultaneous checkouts.
--
-- Instructions: Run this script in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET times_used = COALESCE(times_used, 0) + 1
  WHERE code = promo_code_text;
END;
$$;
