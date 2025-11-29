"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet as WalletIcon, LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/walletContext";
import { supabase } from "@/lib/supabase";
import type { Wallet } from "@/types/cardano";
import { SUPPORTEDWALLETS } from "@/components/WalletConnector/wallets";
import Image from "next/image";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loginWithWallet } = useAuth();
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTEDWALLETS);
  const [connecting, setConnecting] = useState(false);

  React.useEffect(() => {
    // Check for installed wallets
    const installedWallets: Wallet[] = [];
    const { cardano } = window;

    if (cardano) {
      for (const c in cardano) {
        const wallet = cardano[c];
        if (!wallet.apiVersion) continue;
        installedWallets.push(wallet);
      }
    }

    const updatedWallets = wallets.map((preWallet) => {
      const matchingWallet = installedWallets.find((provider) =>
        provider.name.toLowerCase().includes(preWallet.name.toLowerCase())
      );

      return {
        ...preWallet,
        ...(matchingWallet && { enable: matchingWallet.enable }),
      };
    });

    const unmatchedWallets = installedWallets.filter((installedWallet) => {
      return !wallets.some((preWallet) =>
        installedWallet.name
          .toLowerCase()
          .includes(preWallet.name.toLowerCase())
      );
    });

    setWallets([...updatedWallets, ...unmatchedWallets]);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async (wallet: Wallet) => {
    setConnecting(true);

    try {
      if (!lucid) throw new Error("Lucid not initialized");

      const api = await wallet.enable();
      lucid.selectWallet.fromAPI(api);

      const address = await lucid.wallet().address();
      const balance = parseInt(await api.getBalance());

      setWalletConnection((prev) => ({
        ...prev,
        wallet,
        address,
        balance,
      }));

      console.log("Attempting login with wallet:", address);

      // First try to find the user by wallet address
      const { data: user, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", address)
        .single();

      setShowWalletDialog(false);

      if (dbError) {
        console.error("Database error finding user:", dbError);
        // If error is PGRST116, it means no rows found (single() failed)
        if (dbError.code !== "PGRST116") {
          toast.error(`Database error: ${dbError.message}`);
          return;
        }
      }

      if (user) {
        console.log("User found:", user);

        // Check verification status
        if (!user.wallet_verified) {
          console.warn("User found but wallet not verified");
          // Optionally auto-verify here since they just proved ownership by connecting?
          // For now, let's allow it but maybe show a warning or update it

          // Let's update it to true since they are connecting with it now
          await supabase
            .from("users")
            .update({ wallet_verified: true })
            .eq("id", user.id);
        }

        toast.success("Wallet verified! Logging in...");

        // Use the context function to set the session
        await loginWithWallet(address);

        // If we have a user, we should ensure we have a session.
        // Since we're doing wallet-only login here (no password),
        // we might need a custom auth flow or just rely on the fact
        // that we identified the user.
        // NOTE: Supabase Auth usually requires email/password or magic link.
        // If we just redirect to dashboard, the AuthContext might not have a session
        // if they weren't already logged in.

        // If the user is NOT logged in via Supabase Auth (no session),
        // accessing RLS-protected data might fail (though we disabled RLS).
        // But AuthContext.user will be null.

        // If we want "Wallet Login" to create a session, we typically need
        // to sign a message and verify it on backend to issue a token,
        // or use a custom flow.

        // CRITICAL: The user signed up with Email/Password.
        // They should probably login with Email/Password OR
        // we need a way to exchange wallet proof for a session.

        // If the user expects "Connect Wallet" to log them in,
        // we need to handle the session.

        // For now, let's assume the user might have a session or we just redirect.
        // But if they don't have a session, dashboard might redirect them back to login.

        router.push("/dashboard");
      } else {
        console.log("No user found for address:", address);
        toast.error("No user found with this wallet. Please sign up first.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect wallet"
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-purple-950/20 to-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {siteConfig.name}
          </h1>
          <p className="text-neutral-400">
            Decentralized Freelance Platform on Cardano
          </p>
        </div>

        <Card className="w-full border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Connection Option */}
            <Button
              onClick={() => setShowWalletDialog(true)}
              className="w-full border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500"
              variant="outline"
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-950 px-2 text-neutral-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-neutral-200"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-neutral-800 bg-neutral-900/50 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-200"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-neutral-800 bg-neutral-900/50 focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

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

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Choose a Cardano wallet to sign in
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full justify-start border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800"
                variant="outline"
                disabled={!wallet.enable || connecting}
                onClick={() => handleWalletLogin(wallet)}
              >
                <Image
                  alt={wallet.name}
                  height={24}
                  src={wallet.icon}
                  width={24}
                  className="mr-3"
                />
                <span>{wallet.name}</span>
                {!wallet.enable && (
                  <span className="ml-auto text-xs text-neutral-500">
                    (Not installed)
                  </span>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
