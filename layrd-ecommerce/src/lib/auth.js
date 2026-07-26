import { supabase } from './supabase';

// Register a new customer account.
// On success, Supabase Auth creates the user, and the `handle_new_user()`
// trigger (see backend-schema.md) auto-creates a matching `profiles` row.
export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }, // read by handle_new_user() trigger
    },
  });
  if (error) throw error;
  return data; // { user, session }
}

// Log in an existing customer.
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data; // { user, session }
}

// Log out the current user.
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get the currently logged-in user (or null). Use in client components
// that need to check auth state on mount.
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

// Get the current session (includes JWT). Useful for checking if a
// session exists without a full user round-trip.
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

// Fetch the full profile row (role, full_name, phone) for a given user ID.
// Needed anywhere we need to check role (e.g. 'business' pricing, admin checks).
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

// Subscribe to auth state changes (login/logout/token refresh).
// Returns an unsubscribe function — call it in a useEffect cleanup.
export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => listener.subscription.unsubscribe();
}