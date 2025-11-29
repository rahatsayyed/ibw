"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm, type AuthFormData } from "@/components/auth/auth-form";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const handleEmailSignup = async (data: AuthFormData) => {
    if (!data.username) {
      throw new Error("Username is required");
    }

    try {
      // Create account without wallet address initially
      // User will be redirected to complete-profile to add wallet
      const tempWalletAddress = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await signUp(data.email, data.password, data.username, tempWalletAddress);

      toast.success(
        "Account created! Please connect your wallet to complete setup"
      );
      router.push("/auth/complete-profile");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
      throw error;
    }
  };

  const handleWalletAuth = async (walletAddress: string) => {
    // For wallet-based signup, redirect to complete-profile
    // This allows username collection
    toast.info("Please complete your profile");
    router.push("/auth/complete-profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-blue-950/20 to-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Join Talendro
          </h1>
          <p className="text-neutral-400">
            Start earning with trustless smart contracts
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm
          mode="signup"
          onSubmit={handleEmailSignup}
          onWalletAuth={handleWalletAuth}
        />

        {/* Footer */}
        <div className="text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign in
          </Link>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-neutral-500">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-purple-400 hover:text-purple-300">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-purple-400 hover:text-purple-300"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
