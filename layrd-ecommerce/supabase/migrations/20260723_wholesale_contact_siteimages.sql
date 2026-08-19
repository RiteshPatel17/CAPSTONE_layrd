-- ─────────────────────────────────────────────
-- LÄYRD – Migration: 2026-07-23
-- Wholesale application fields, Contact Messages table,
-- Site Images table.
-- All statements are idempotent (safe to re-run).
-- ─────────────────────────────────────────────

-- ── Generic reusable updated_at trigger ──────
-- Any table with an `updated_at` column should use this instead of
-- writing a one-off trigger function per table.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Wholesale applications: new fields for the redesigned admin flow ──
alter table wholesale_applications
  add column if not exists expected_volume text,
  add column if not exists expected_frequency text,
  add column if not exists contacted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

drop trigger if exists trg_wholesale_updated_at on wholesale_applications;
create trigger trg_wholesale_updated_at
  before update on wholesale_applications
  for each row execute function set_updated_at();

-- Widen status constraint to accept both legacy and new status values
-- during the transition period. Do NOT auto-migrate existing row values —
-- that's a deliberate, separate step once everything is confirmed stable.
alter table wholesale_applications drop constraint if exists wholesale_applications_status_check;
alter table wholesale_applications add constraint wholesale_applications_status_check
  check (status = ANY (ARRAY[
    'Pending', 'Approved', 'Rejected',
    'New', 'Contacted', 'Qualified', 'Not a Fit', 'Closed'
  ]::text[]));

-- ── Contact Messages ──────────────────────────
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
-- No public policies — only the service-role key (via requireAdmin/
-- verifyAdminRequest in application code) can read or write this table.

-- ── Site Images ────────────────────────────────
-- Named site-wide images (hero banners, occasion cards, etc.) that
-- aren't tied to a specific product. Add more rows anytime, no schema
-- change needed.
create table if not exists site_images (
  key text primary key,
  image_url text,
  updated_at timestamptz default now()
);

insert into site_images (key, image_url) values
  ('events_hero', null),
  ('events_birthday', null),
  ('events_wedding', null),
  ('events_corporate', null)
on conflict (key) do nothing;