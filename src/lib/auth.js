// ─────────────────────────────────────────────
// LÄYRD – Auth utilities
// Wired to Supabase Auth
// ─────────────────────────────────────────────
import { supabase } from "./supabase.js";

/**
 * Sign up a new user
 * @param {{ email: string, password: string, fullName: string, role?: string }} params
 */
export async function signUp({ email, password, fullName, role = "customer" }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        full_name: fullName, 
        role: role 
      } 
    }
  });
  
  if (error) {
    console.error("[AUTH] Sign up error:", error);
  }
  return { data, error };
}

/**
 * Sign in a user
 * @param {{ email: string, password: string }} params
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error("[AUTH] Sign in error:", error);
  }
  return { data, error };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[AUTH] Sign out error:", error);
  }
  return { error };
}

/**
 * Get current session / user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Also fetch their profile to get their role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  return { ...user, profile };
}

/**
 * Check if current user is admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.profile?.role === "admin";
}

/**
 * Check if current user is business account
 */
export async function isBusinessUser() {
  const user = await getCurrentUser();
  return user?.profile?.role === "business" || user?.profile?.role === "admin";
}

/**
 * Reset password for email
 * @param {string} email
 */
export async function resetPasswordForEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password-confirm`,
  });
  
  if (error) {
    console.error("[AUTH] Reset password error:", error);
  }
  return { data, error };
}

/**
 * Update password (used after redirecting from reset email)
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    console.error("[AUTH] Update password error:", error);
  }
  return { data, error };
}
