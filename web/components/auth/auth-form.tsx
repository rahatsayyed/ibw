"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet as WalletIcon, LoaderCircle } from "lucide-react";
import { useWallet } from "@/context/walletContext";
import type { Wallet } from "@/types/cardano";
import { SUPPORTEDWALLETS } from "@/components/WalletConnector/wallets";
import Image from "next/image";

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: AuthFormData) => Promise<void>;
  onWalletAuth?: (walletAddress: string) => Promise<void>;
}

export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  walletAddress?: string;
}

export function AuthForm({ mode, onSubmit, onWalletAuth }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    username: "",
    walletAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTEDWALLETS);
  const [connecting, setConnecting] = useState(false);
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid } = walletConnection;

  useEffect(() => {
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleWalletConnect = async (wallet: Wallet) => {
    setConnecting(true);
    setError("");

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

      setShowWalletDialog(false);

      // Call wallet auth handler if provided
      if (onWalletAuth && address) {
        await onWalletAuth(address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create account"}
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {mode === "login"
              ? "Sign in to your account to continue"
              : "Start your freelancing journey on Cardano"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Connection Option */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500"
            onClick={() => setShowWalletDialog(true)}
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
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-neutral-200"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="border-neutral-800 bg-neutral-900/50 focus:border-purple-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-neutral-200"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-neutral-800 bg-neutral-900/50 focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : mode === "login"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wallet Connection Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-[425px] border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Choose a Cardano wallet to connect to your account
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
    </>
  );
}
