-- ─────────────────────────────────────────────────────────────────────
-- LÄYRD E-Commerce – Supabase Schema
-- Run this in your Supabase SQL Editor to create the database tables.
-- ─────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS / PROFILES ────────────────────────────────────────────────
-- Supabase Auth manages the auth.users table.
-- We extend it with a profiles table for extra fields.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── PRODUCTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  flavour_id TEXT NOT NULL,
  size_ml INTEGER NOT NULL DEFAULT 250 CHECK (size_ml IN (150, 250, 330)),
  category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'limited')),
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold_out', 'coming_soon', 'hidden')),
  description TEXT,
  ingredients TEXT,
  allergens TEXT[], -- array of allergen strings
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  drop_date TIMESTAMPTZ, -- for scheduled product drops
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVENTORY BATCHES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || FLOOR(RANDOM() * 900000 + 100000)::TEXT,
  user_id UUID REFERENCES profiles(id), -- NULL for guest checkout
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery')),
  delivery_address TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  pickup_date DATE,
  pickup_time TEXT,
  payment_method TEXT NOT NULL DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'etransfer', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_session_id TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  promo_code TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Paid', 'Pending Payment', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled', 'Refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL, -- snapshot at time of order
  size_ml INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  sweetness TEXT, -- for espresso
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENT INQUIRIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_number TEXT UNIQUE DEFAULT 'EVT-' || FLOOR(RANDOM() * 900000 + 100000)::TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  guest_count INTEGER,
  core_cans INTEGER DEFAULT 0,
  limited_cans INTEGER DEFAULT 0,
  total_cans INTEGER GENERATED ALWAYS AS (core_cans + limited_cans) STORED,
  estimated_total DECIMAL(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deposit_paid', 'completed', 'cancelled')),
  admin_notes TEXT,
  deposit_amount DECIMAL(10,2),
  deposit_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI LABEL REQUESTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_label_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_inquiry_id UUID REFERENCES event_inquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  tone TEXT NOT NULL,
  event_type TEXT,
  suggestions TEXT[], -- 3 AI suggestions
  selected_text TEXT,
  edited_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'needs_changes', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WHOLESALE APPLICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  instagram TEXT,
  website TEXT,
  license_url TEXT, -- Supabase Storage URL
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BUSINESS VERIFICATION CODES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  application_id UUID REFERENCES wholesale_applications(id),
  email TEXT NOT NULL, -- who it's for
  created_by UUID REFERENCES profiles(id), -- admin who generated
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WHOLESALE ORDERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE DEFAULT 'WSO-' || FLOOR(RANDOM() * 900000 + 100000)::TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  total_cans INTEGER NOT NULL,
  price_per_can DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  requested_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'preparing', 'completed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WHOLESALE ORDER ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wholesale_order_id UUID REFERENCES wholesale_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  flavour_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- ─── PROMO CODES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_delivery')),
  value DECIMAL(10,2) NOT NULL DEFAULT 0, -- 10 = 10% or $10
  max_uses INTEGER, -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FAQS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL DEFAULT 'General',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTACT MESSAGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AVAILABILITY SLOTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,   -- e.g. "11:00 AM"
  max_orders INTEGER DEFAULT 5,
  current_orders INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  type TEXT DEFAULT 'both' CHECK (type IN ('pickup', 'delivery', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SETTINGS (Admin configurable) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_email TEXT,
  store_phone TEXT,
  social_handle TEXT,
  pickup_area TEXT,
  pickup_address TEXT,
  gst_rate DECIMAL(5,2) DEFAULT 5.00,
  delivery_enabled BOOLEAN DEFAULT true,
  delivery_tiers JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (id, store_email, store_phone, social_handle, pickup_area, pickup_address, gst_rate, delivery_enabled) VALUES
  (1, 'info@layrd.org', '403-399-3903', '@l.a.y.r.d', 'Pineridge NE, Calgary', NULL, 5.00, true)
ON CONFLICT (id) DO NOTHING;

-- ─── WAITLIST ENTRIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────────────
-- Enable RLS on sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_label_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Orders: users can view their own, guests see nothing (managed server-side)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- Event inquiries: users can view their own
CREATE POLICY "Users can view own event inquiries" ON event_inquiries FOR SELECT USING (auth.uid() = user_id);

-- Wholesale: users can view their own applications
CREATE POLICY "Users can view own wholesale apps" ON wholesale_applications FOR SELECT USING (auth.uid() = user_id);

-- TODO: Add admin policies that allow admin role to see all records
