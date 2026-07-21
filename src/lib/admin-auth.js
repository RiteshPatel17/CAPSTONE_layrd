// ─────────────────────────────────────────────
// LÄYRD – admin-auth.js
// Mock admin authentication using localStorage.
// Replace with Supabase Auth when ready.
//
// TODO: Replace loginAdmin() with → supabase.auth.signInWithPassword({ email, password })
// TODO: Replace logoutAdmin() with → supabase.auth.signOut()
// TODO: Replace isAdminLoggedIn() with → supabase.auth.getSession()
// ─────────────────────────────────────────────

// Demo credentials — development only
const ADMIN_EMAIL = "admin@layrd.org";
const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "layrd_admin_session";

/**
 * Attempt to log in with email + password.
 * Returns { success: true } or { success: false, error: "..." }
 */
export function loginAdmin(email, password) {
  if (
    email.trim().toLowerCase() === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {
    // TODO: Replace with Supabase JWT session
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: ADMIN_EMAIL, loggedInAt: Date.now() })
    );
    return { success: true };
  }
  return { success: false, error: "Invalid email or password." };
}

/**
 * Clear the admin session and redirect to login.
 */
export function logoutAdmin() {
  // TODO: Replace with → await supabase.auth.signOut()
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns true if an admin session exists.
 */
export function isAdminLoggedIn() {
  if (typeof window === "undefined") return false; // SSR safety
  try {
    const session = localStorage.getItem(STORAGE_KEY);
    return !!session;
  } catch {
    return false;
  }
}
