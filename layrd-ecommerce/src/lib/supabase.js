import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client — safe to use in browser/client components.
// Uses the anon key; all access is governed by Row Level Security (RLS) policies.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server-only admin client — uses the service role key, which BYPASSES RLS entirely.
// NEVER import this from a client component ("use client" file).
// Only call this from Next.js API routes (src/app/api/**/route.js).
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}