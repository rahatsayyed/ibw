"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    walletAddress: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loginWithWallet: (address: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const loginWithWallet = async (address: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", address)
        .single();

      if (error) throw error;

      setUserProfile(data);
      // Persist wallet session
      localStorage.setItem("wallet_session", address);
    } catch (error) {
      console.error("Error logging in with wallet:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    walletAddress: string
  ) => {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: email,
        username: username,
        wallet_address: walletAddress,
      });

      if (profileError) throw profileError;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("wallet_session");
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user && !userProfile) throw new Error("No user logged in");

    // If we have a supabase user, update by ID
    if (user) {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      await fetchUserProfile(user.id);
    }
    // If we only have wallet session (userProfile but no user), update by wallet address
    else if (userProfile) {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("wallet_address", userProfile.wallet_address);

      if (error) throw error;

      // Refresh profile
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", userProfile.wallet_address)
        .single();

      if (data) setUserProfile(data);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async () => {
      try {
        // 1. Check Supabase Session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          // 2. Check Wallet Session
          const savedWallet = localStorage.getItem("wallet_session");
          if (savedWallet) {
            await loginWithWallet(savedWallet);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
        // Clear wallet session if supabase session exists to avoid conflict
        localStorage.removeItem("wallet_session");
      } else {
        setUser(null);
        // Only clear profile if no wallet session
        if (!localStorage.getItem("wallet_session")) {
          setUserProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut: logout,
    updateProfile,
    loginWithWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
