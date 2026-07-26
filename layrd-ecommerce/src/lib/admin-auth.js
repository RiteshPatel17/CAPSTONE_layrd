import { supabase } from './supabase';

// Log in as admin. Uses the SAME Supabase Auth as customers — the only
// difference is we verify role = 'admin' on the profiles row afterward.
// If the logged-in user isn't an admin, we immediately sign them back out
// and throw, so a regular customer account can never sit in an "admin session."
export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('This account does not have admin access.');
  }

  return data; // { user, session }
}

// Log out of the admin session (same as customer sign-out — one session type).
export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Check if the current session belongs to a logged-in admin.
// Returns true/false. Used by AdminAuthGuard on mount.
export async function isAdminLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) return false;
  return profile?.role === 'admin';
}