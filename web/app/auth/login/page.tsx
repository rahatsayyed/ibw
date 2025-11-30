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
import { Wallet as WalletIcon, LoaderCircle, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 z-0 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              {/* Logo Placeholder or Icon */}
              <div className="w-8 h-8 bg-primary rounded-lg shadow-inner" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {siteConfig.name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back to the future of work
          </p>
        </div>

        <Card className="w-full border-primary/10 bg-card/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Wallet Connection Option */}
            <Button
              onClick={() => setShowWalletDialog(true)}
              className="w-full h-12 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group"
              variant="outline"
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-primary" />
                  <span className="text-primary">Connecting...</span>
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-primary font-medium">Connect Wallet</span>
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
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
                  className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Create an account
          </Link>
        </div>
      </div>

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a Cardano wallet to sign in
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full justify-start h-14 border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group"
                variant="outline"
                disabled={!wallet.enable || connecting}
                onClick={() => handleWalletLogin(wallet)}
              >
                <div className="p-2 rounded-lg bg-white/5 mr-3 group-hover:bg-white/10 transition-colors">
                  <Image
                    alt={wallet.name}
                    height={24}
                    src={wallet.icon}
                    width={24}
                  />
                </div>
                <span className="text-lg text-foreground group-hover:text-primary transition-colors">{wallet.name}</span>
                {!wallet.enable && (
                  <span className="ml-auto text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded">
                    Not installed
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
