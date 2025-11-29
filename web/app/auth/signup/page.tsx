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
import { Wallet as WalletIcon, LoaderCircle, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-blue-950/20 to-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Join {siteConfig.name}
          </h1>
          <p className="text-neutral-400">
            Start earning with trustless smart contracts
          </p>
        </div>

        <Card className="w-full border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === "form" ? "Create account" : "Connect your wallet"}
            </CardTitle>
            <CardDescription className="text-neutral-400">
              {step === "form"
                ? "Enter your details to get started"
                : "Connect your Cardano wallet to complete signup"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "form" ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-neutral-200"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-neutral-800 bg-neutral-900/50 focus:border-purple-500"
                  />
                </div>

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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Continue
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {connectedAddress ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-500">
                          Wallet Connected
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {connectedAddress}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleCompleteSignup}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Complete Sign Up"
                      )}
                    </Button>
                  </div>
                ) : (
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
                        Connect Cardano Wallet
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={() => setStep("form")}
                  variant="ghost"
                  className="w-full text-neutral-400 hover:text-white"
                >
                  ← Back to form
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Choose a Cardano wallet to complete your registration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full justify-start border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800"
                variant="outline"
                disabled={!wallet.enable || connecting}
                onClick={() => handleWalletConnect(wallet)}
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
