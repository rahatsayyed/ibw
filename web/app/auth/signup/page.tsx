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
import { Wallet as WalletIcon, LoaderCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/walletContext";
import { supabase } from "@/lib/supabase";
import type { Wallet } from "@/types/cardano";
import { SUPPORTEDWALLETS } from "@/components/WalletConnector/wallets";
import Image from "next/image";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"form" | "wallet">("form");
  const [loading, setLoading] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTEDWALLETS);
  const [connecting, setConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string>("");

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !username) {
      toast.error("Please fill in all fields");
      return;
    }

    // Move to wallet connection step
    setStep("wallet");
    toast.info("Now connect your wallet to complete signup");
  };

  const handleWalletConnect = async (wallet: Wallet) => {
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

      setConnectedAddress(address);
      setShowWalletDialog(false);
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect wallet"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);

    try {
      // Check if wallet address is already used
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", connectedAddress)
        .single();

      if (existingUser) {
        toast.error("This wallet is already registered. Please login instead.");
        setLoading(false);
        return;
      }

      // Create account with wallet address
      await signUp(email, password, username, connectedAddress);

      // Mark wallet as verified
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ wallet_verified: true })
          .eq("id", user.id);

        if (updateError) {
          console.error("Failed to verify wallet on signup:", updateError);
          toast.error("Account created but failed to verify wallet status.");
        }
      }

      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-neutral-950 to-neutral-950 p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-xl shadow-2xl">
              {/* Logo Placeholder or Icon */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
            Join {siteConfig.name}
          </h1>
          <p className="text-neutral-400 text-lg">
            Start earning with trustless smart contracts
          </p>
        </div>

        <Card className="w-full border-white/10 bg-neutral-900/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight text-white">
              {step === "form" ? "Create your account" : "Connect your wallet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {step === "form" ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-neutral-300"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-neutral-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-neutral-300"
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
                    className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-neutral-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-neutral-300"
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
                    className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-neutral-600"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all duration-300"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                  <p className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    Connect your wallet to verify your identity and enable payments.
                  </p>
                </div>

                {!connectedAddress ? (
                  <Button
                    onClick={() => setShowWalletDialog(true)}
                    className="w-full h-12 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-500/50 transition-all duration-300 group"
                    variant="outline"
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-blue-400" />
                        <span className="text-blue-100">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <WalletIcon className="mr-2 h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-blue-100 font-medium">Connect Wallet</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 flex items-center justify-between">
                      <span className="text-sm font-mono truncate max-w-[200px]">
                        {connectedAddress}
                      </span>
                      <span className="text-xs font-bold bg-green-500/20 px-2 py-1 rounded text-green-300">
                        CONNECTED
                      </span>
                    </div>
                    <Button
                      onClick={handleCompleteSignup}
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium shadow-lg shadow-green-900/20 transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Complete Signup"
                      )}
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => setStep("form")}
                  className="w-full text-neutral-400 hover:text-white hover:bg-white/5"
                >
                  Back to details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Choose a Cardano wallet to connect
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full justify-start h-14 border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group"
                variant="outline"
                disabled={!wallet.enable || connecting}
                onClick={() => handleWalletConnect(wallet)}
              >
                <div className="p-2 rounded-lg bg-white/5 mr-3 group-hover:bg-white/10 transition-colors">
                  <Image
                    alt={wallet.name}
                    height={24}
                    src={wallet.icon}
                    width={24}
                  />
                </div>
                <span className="text-lg text-neutral-200 group-hover:text-white transition-colors">{wallet.name}</span>
                {!wallet.enable && (
                  <span className="ml-auto text-xs text-neutral-600 bg-neutral-900/50 px-2 py-1 rounded">
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
