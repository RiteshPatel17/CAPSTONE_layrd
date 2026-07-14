// ─────────────────────────────────────────────
// LÄYRD – Supabase client
// Real client using @supabase/supabase-js.
// Keys are read from .env.local (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY).
// ─────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// ── Public / browser client (uses anon key, respects Row Level Security) ──
// Falls back to placeholders so a missing env var fails at the point of
// use (a clear Supabase error) instead of crashing on import.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

// ── Server-side admin client (uses service role key — server/API routes only!) ──
// NEVER import this in client components.
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY env var");
    return supabase; // fallback to anon client
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}