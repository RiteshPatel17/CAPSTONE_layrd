// ─────────────────────────────────────────────
// LÄYRD – admin-server-auth.js
// Server-only helper: verifies a request is from a logged-in
// Supabase Auth user whose profile role is "admin".
// Replaces the old admin_users / layrd_admin_session cookie system —
// there is now a single identity (Supabase Auth) for everyone,
// customers and admins alike.
//
// Client side, call getAuthHeader() from "@/lib/auth" and spread the
// result into your fetch()'s headers:
//
//   const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
//   fetch("/api/admin/promo-codes", { headers, ... });
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase.js";

/**
 * Verifies the request's Authorization: Bearer <token> header belongs to
 * a logged-in user whose profile role is "admin".
 * Returns the Supabase auth user on success, or null on failure.
 */
export async function verifyAdminRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return requireAdmin(token);
}

/**
 * Same check as verifyAdminRequest(), but for Server Actions instead of
 * API routes. Server Actions can't read the Authorization header (there
 * is no `request` object) or localStorage (they run server-side), so the
 * caller must fetch its own session token client-side first and pass it
 * in explicitly as the first argument to every admin Server Action.
 *
 * Usage in a Server Action:
 *   export async function getBatches(accessToken) {
 *     const admin = await requireAdmin(accessToken);
 *     if (!admin) throw new Error("Unauthorized");
 *     ...
 *   }
 *
 * Usage on the calling page/component:
 *   const { data: { session } } = await supabase.auth.getSession();
 *   const batches = await getBatches(session?.access_token);
 */
export async function requireAdmin(accessToken) {
  if (!accessToken) return null;

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") return null;

  return user;
}