-- ─────────────────────────────────────────────
-- LÄYRD – Migration: 2026-07-24
-- Adds the user_id column to orders (declared in schema.sql but never
-- actually applied to the live database — checkout now writes it on
-- every order and /api/orders filters by it for the customer's
-- "My Orders" view, so it must exist).
-- Idempotent, safe to re-run.
-- ─────────────────────────────────────────────

alter table orders
  add column if not exists user_id uuid references profiles(id);

create index if not exists idx_orders_user_id on orders(user_id);
