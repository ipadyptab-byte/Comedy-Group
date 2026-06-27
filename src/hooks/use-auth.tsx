"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Family, Member } from "@/types/database";
import type { User } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  family: Family | null;
  member: Member | null;
  role: "admin" | "captain" | "member";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserData = async (authUser: User) => {
    try {
      // Get user family mapping
      const { data: userFamily, error: ufError } = await supabase
        .from("user_families")
        .select(`
          family:families(*),
          member:members(*)
        `)
        .eq("user_id", authUser.id)
        .single();

      if (ufError && ufError.code !== "PGRST116") {
        console.error("Error fetching user family:", ufError);
      }

      const familyData = Array.isArray(userFamily) ? userFamily[0] : userFamily;

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        family: familyData?.family || null,
        member: familyData?.member || null,
        role: familyData?.member?.role || "member",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        family: null,
        member: null,
        role: "member",
      });
    }
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserData(authUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await fetchUserData(authUser);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await fetchUserData(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
