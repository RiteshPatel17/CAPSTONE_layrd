"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/auth";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const p = await getProfile(currentUser.id);
    setProfile(p);
  }

  useEffect(() => {
    // On mount: check for an existing session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser).finally(() => setLoading(false));
    });

    // Subscribe to login/logout/token refresh events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfile(currentUser);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = {
    user,               // Supabase auth.users object, or null
    profile,            // public.profiles row (role, full_name, phone), or null
    loading,            // true until the initial session check completes
    isLoggedIn: !!user,
    isAdmin: profile?.role === "admin",
    isBusiness: profile?.role === "business",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for any client component to read auth state:
// const { user, profile, isLoggedIn, isAdmin } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}