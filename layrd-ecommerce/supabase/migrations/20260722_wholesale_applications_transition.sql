-- Wholesale applications: add columns needed for the new form/admin flow.
-- Additive only — no existing columns renamed or dropped, no rows touched.

alter table wholesale_applications
  add column if not exists expected_volume text,
  add column if not exists expected_frequency text,
  add column if not exists contacted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Auto-update updated_at on every row change
create or replace function set_wholesale_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wholesale_updated_at on wholesale_applications;
create trigger trg_wholesale_updated_at
  before update on wholesale_applications
  for each row execute function set_wholesale_updated_at();

-- Widen status constraint to accept BOTH old and new values during transition.
-- Do NOT migrate existing row values yet — that happens in a separate,
-- explicitly-run step once the API and Admin UI both support the new values.
alter table wholesale_applications drop constraint if exists wholesale_applications_status_check;
alter table wholesale_applications add constraint wholesale_applications_status_check
  check (status = ANY (ARRAY[
    'Pending', 'Approved', 'Rejected',
    'New', 'Contacted', 'Qualified', 'Not a Fit', 'Closed'
  ]::text[]));