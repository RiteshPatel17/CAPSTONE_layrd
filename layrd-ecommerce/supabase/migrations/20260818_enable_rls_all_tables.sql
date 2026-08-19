-- ─────────────────────────────────────────────────────────────────────
-- Enable Row Level Security on every remaining table + add admin
-- bypass policies that were missing even on the tables RLS was already
-- on for (see the "TODO: Add admin policies" note this replaces).
--
-- IMPORTANT: this targets the REAL live schema, not schema.sql, which
-- has drifted significantly (confirmed via the Supabase REST OpenAPI
-- spec + the 20260722-20260725 migrations). Specifically:
--   - wholesale_orders / wholesale_order_items / waitlist_entries do
--     NOT exist live — schema.sql declared them but they were never
--     actually created. Skipped entirely.
--   - schema.sql's business_verification_codes is really named
--     business_codes live, with a simpler column set.
--   - committed_order_items and site_images exist live but were never
--     in schema.sql at all — included here since they're real,
--     PostgREST-exposed tables.
--   - wholesale_applications has no user_id column live (unlike
--     schema.sql's version) — admin-only, no "own row" policy.
--
-- Context: every real read/write in this app already goes through
-- server-side code using the Supabase SERVICE ROLE key
-- (getSupabaseAdmin() in src/lib/supabase.js), which bypasses RLS
-- entirely — these policies exist to close off direct access via the
-- public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY, which is shipped in
-- the browser bundle by design) for anyone going around the app.
--
-- Idempotent — every CREATE POLICY is preceded by a matching
-- DROP POLICY IF EXISTS, so this is safe to re-run.
-- Run this in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────

-- ── Helper: is the current user an admin? ──────────────────────────
-- SECURITY DEFINER so this can be used inside a policy ON profiles
-- itself without recursing into profiles' own RLS check.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Admin bypass on the tables that already had RLS ─────────────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all event inquiries" ON event_inquiries;
CREATE POLICY "Admins can view all event inquiries" ON event_inquiries FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can update all event inquiries" ON event_inquiries;
CREATE POLICY "Admins can update all event inquiries" ON event_inquiries FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all ai label requests" ON ai_label_requests;
CREATE POLICY "Admins can view all ai label requests" ON ai_label_requests FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can update all ai label requests" ON ai_label_requests;
CREATE POLICY "Admins can update all ai label requests" ON ai_label_requests FOR UPDATE USING (is_admin());

-- ── PRODUCTS: public catalog data ───────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view non-hidden products" ON products;
CREATE POLICY "Anyone can view non-hidden products" ON products FOR SELECT USING (status <> 'hidden');
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin());

-- ── INVENTORY BATCHES: internal only ────────────────────────────────
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory_batches;
CREATE POLICY "Admins can manage inventory" ON inventory_batches FOR ALL USING (is_admin());

-- ── ORDER ITEMS: visible to the owning order's user + admins ───────
-- (orders.user_id is real — added by 20260724_orders_user_id.sql)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (is_admin());

-- ── COMMITTED ORDER ITEMS: this is a VIEW, not a table (confirmed by ──
-- the "cannot ALTER ... ENABLE ROW SECURITY on a view" error) — views
-- don't support RLS policies, access is controlled via GRANT/REVOKE
-- instead. Same shape as order_items, unused by any app code path —
-- revoke anon/authenticated read access entirely rather than leaving
-- it on the default grant.
REVOKE SELECT ON committed_order_items FROM anon, authenticated;

-- ── WHOLESALE APPLICATIONS: RLS was never actually turned on ───────
-- No user_id column live, so no "own row" policy — admin only.
ALTER TABLE wholesale_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage wholesale applications" ON wholesale_applications;
CREATE POLICY "Admins can manage wholesale applications" ON wholesale_applications FOR ALL USING (is_admin());

-- ── BUSINESS CODES: sensitive, admin only ───────────────────────────
-- (never expose these to anon/authenticated — a readable code is a
-- self-service "become a business account" bypass)
ALTER TABLE business_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage business codes" ON business_codes;
CREATE POLICY "Admins can manage business codes" ON business_codes FOR ALL USING (is_admin());

-- ── PROMO CODES: never expose values/usage counts directly ──────────
-- (promo-code-service validates codes server-side with the service
-- role key; a direct anon read/write here would let anyone edit
-- discount values or usage counts, or read codes ahead of a launch)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes" ON promo_codes FOR ALL USING (is_admin());

-- ── FAQS: public content ─────────────────────────────────────────────
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published faqs" ON faqs;
CREATE POLICY "Anyone can view published faqs" ON faqs FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admins can manage faqs" ON faqs;
CREATE POLICY "Admins can manage faqs" ON faqs FOR ALL USING (is_admin());

-- ── CONTACT MESSAGES: already had RLS on (20260723 migration), but no ──
-- admin policy existed yet — this is the only new thing here.
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;
CREATE POLICY "Admins can manage contact messages" ON contact_messages FOR ALL USING (is_admin());

-- ── AVAILABILITY SLOTS: public read (customers pick a slot at checkout) ──
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view availability slots" ON availability_slots;
CREATE POLICY "Anyone can view availability slots" ON availability_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage availability slots" ON availability_slots;
CREATE POLICY "Admins can manage availability slots" ON availability_slots FOR ALL USING (is_admin());

-- ── SETTINGS: non-secret store config, public read ──────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
CREATE POLICY "Anyone can view settings" ON settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (is_admin());

-- ── SITE IMAGES: served publicly via /api/site-images (service role) ──
-- not read directly by any client-side code — admin only.
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage site images" ON site_images;
CREATE POLICY "Admins can manage site images" ON site_images FOR ALL USING (is_admin());
