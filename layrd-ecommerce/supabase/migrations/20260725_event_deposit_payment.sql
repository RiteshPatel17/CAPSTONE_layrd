-- ─────────────────────────────────────────────
-- LÄYRD – Migration: 2026-07-25
-- Adds the columns needed for the event booking 50% deposit payment flow.
-- schema.sql claims most of these already exist on event_inquiries, but
-- the live database disagrees (same class of drift as orders.user_id) —
-- confirmed live by a "Could not find the 'estimated_total' column" error.
-- Every column below uses IF NOT EXISTS, so this is safe to run regardless
-- of which ones are actually already there.
--   estimated_total    — full event cost before the 50% deposit split
--   deposit_amount     — the 50% deposit amount itself
--   deposit_paid       — boolean flag the app reads/writes (schema.sql only
--                        ever declared deposit_paid_at, a timestamp)
--   stripe_session_id  — tracks the Stripe Checkout Session for the deposit,
--                        mirroring orders.stripe_session_id
-- Idempotent, safe to re-run.
-- ─────────────────────────────────────────────

alter table event_inquiries
  add column if not exists estimated_total numeric(10,2),
  add column if not exists deposit_amount numeric(10,2),
  add column if not exists deposit_paid boolean not null default false,
  add column if not exists stripe_session_id text;
