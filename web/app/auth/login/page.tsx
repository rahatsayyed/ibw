"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm, type AuthFormData } from "@/components/auth/auth-form";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/walletContext";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, userProfile } = useAuth();
  const [walletConnection] = useWallet();

  useEffect(() => {
    // If user is logged in and wallet is connected, verify it matches
    if (userProfile && walletConnection.address) {
      verifyWallet();
    }
  }, [userProfile, walletConnection.address]);

  const handleEmailLogin = async (data: AuthFormData) => {
    try {
      await signIn(data.email, data.password);
      // After login, we'll check if wallet needs verification
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
      throw error;
    }
  };

  const verifyWallet = () => {
    if (!userProfile || !walletConnection.address) return;

    // Check if wallet verification is required
    if (!userProfile.wallet_verified) {
      toast.warning("Please complete your profile by connecting your wallet");
      router.push("/auth/complete-profile");
      return;
    }

    // Verify wallet address matches
    if (userProfile.wallet_address !== walletConnection.address) {
      toast.error(
        "Wrong wallet connected! Please connect the wallet associated with your account."
      );
      toast.error(
        `Expected: ${userProfile.wallet_address.substring(0, 20)}...`
      );
      return;
    }

    // Wallet verified successfully
    toast.success("Wallet verified successfully!");
    router.push("/dashboard");
  };

  const handleWalletAuth = async (walletAddress: string) => {
    // Wallet connection handled in useEffect above
    toast.info("Verifying wallet...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-purple-950/20 to-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Talendro
          </h1>
          <p className="text-neutral-400">
            Decentralized Freelance Platform on Cardano
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm
          mode="login"
          onSubmit={handleEmailLogin}
          onWalletAuth={handleWalletAuth}
        />

        {/* Footer */}
        <div className="text-center text-sm text-neutral-400">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
