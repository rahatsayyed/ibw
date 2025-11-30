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
import {
  Wallet as WalletIcon,
  LoaderCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/walletContext";
import { supabase } from "@/lib/supabase";
import type { Wallet } from "@/types/cardano";
import { SUPPORTEDWALLETS } from "@/components/WalletConnector/wallets";
import Image from "next/image";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { registerUser } from "@/lib/contracts/userProfile";

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

      // Register user on-chain first
      let txHash = "";
      if (lucid) {
        toast.info(
          "Please sign the transaction to register your profile on-chain."
        );
        try {
          txHash = await registerUser(lucid, username);
          toast.success(`On-chain registration submitted! Tx Hash: ${txHash}`);
        } catch (chainError) {
          console.error("On-chain registration failed:", chainError);
          toast.error(
            "On-chain registration failed. Account was not created. Please try again."
          );
          setLoading(false);
          return;
        }
      }

      // Create account with wallet address
      try {
        await signUp(email, password, username, connectedAddress);
      } catch (signUpError) {
        console.error("Supabase signup failed:", signUpError);
        toast.error(
          "Account creation failed, but on-chain transaction was submitted. Please contact support."
        );
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
      <div className="absolute top-0 right-0 w-full h-full bg-grid-pattern opacity-10 z-0 pointer-events-none" />

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
            Join {siteConfig.name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Start earning with trustless smart contracts
          </p>
        </div>

        <Card className="w-full border-primary/10 bg-card/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              {step === "form" ? "Create your account" : "Connect your wallet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {step === "form" ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

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
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
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
                    className="h-11 border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                  <p className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    Connect your wallet to verify your identity and enable
                    payments.
                  </p>
                </div>

                {!connectedAddress ? (
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
                        <span className="text-primary font-medium">
                          Connect Wallet
                        </span>
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
                      className="w-full h-11 bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300"
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
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  Back to details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:text-primary/80">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-primary hover:text-primary/80"
          >
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a Cardano wallet to connect
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full justify-start h-14 border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group"
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
                <span className="text-lg text-foreground group-hover:text-primary transition-colors">
                  {wallet.name}
                </span>
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
