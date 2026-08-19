-- ─────────────────────────────────────────────
-- LÄYRD – Migration: 2026-07-24
-- Adds a site_images key for the wholesale page hero, so that image
-- is no longer a hardcoded Supabase storage URL in source (which also
-- exposed the project ref). Seeded with the current image so nothing
-- changes visually; swap it via the site_images table going forward.
-- Idempotent, safe to re-run.
-- ─────────────────────────────────────────────

insert into site_images (key, image_url) values
  ('wholesale_hero', 'https://mkuylszbgdmyuhyhkogq.supabase.co/storage/v1/object/public/product-images/CanCake/stack.jpg')
on conflict (key) do nothing;
