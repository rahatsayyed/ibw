"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTEDWALLETS);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string>("");

  useEffect(() => {
    // Redirect if no user or already verified
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (userProfile?.wallet_verified) {
      router.push("/dashboard");
      return;
    }

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
  }, [user, userProfile, router]);

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
      toast.success("Wallet connected successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect wallet"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!user || !connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setSaving(true);

    try {
      // Check if wallet address is already used by another account
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", connectedAddress)
        .neq("id", user.id)
        .single();

      if (existingUser) {
        toast.error("This wallet is already connected to another account");
        setSaving(false);
        return;
      }

      // Update user with wallet address and mark as verified
      const { error } = await supabase
        .from("users")
        .update({
          wallet_address: connectedAddress,
          wallet_verified: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile completed! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save wallet address"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
      <div className="absolute top-0 right-0 w-full h-full bg-grid-pattern opacity-10 z-0 pointer-events-none" />

      <Card className="w-full max-w-md border-primary/10 bg-card/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect your Cardano wallet to finish setting up your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedAddress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-500">
                    Wallet Connected
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {connectedAddress}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveWallet}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowWalletDialog(true)}
              className="w-full border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group"
              variant="outline"
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-primary" />
                  <span className="text-primary">Connecting...</span>
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-primary font-medium">Connect Cardano Wallet</span>
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Your wallet address will be used to verify your identity and receive
            payments
          </p>
        </CardContent>
      </Card>

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a Cardano wallet to complete your profile
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
