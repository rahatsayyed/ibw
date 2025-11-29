"use client";
import { useEffect, useState } from "react";
import { LoaderCircle, LogOut, Wallet as WalletIcon } from "lucide-react";
import Image from "next/image";

import { Button } from "../ui/button";

import { Wallet } from "@/types/cardano";
import { handleError } from "@/lib/utils";
import { useWallet } from "@/context/walletContext";
import { mkLucid } from "@/lib/lucid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SUPPORTEDWALLETS } from "./wallets";

export default function WalletComponent() {
  const [walletConnection, setWalletConnection] = useWallet();
  const { lucid, address } = walletConnection;

  const [wallets, setWallets] = useState<Wallet[]>(SUPPORTEDWALLETS);
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState<boolean>(false);

  useEffect(() => {
    mkLucid(setWalletConnection);

    const installedWallets: Wallet[] = [];
    const { cardano } = window;

    for (const c in cardano) {
      const wallet = cardano[c];

      if (!wallet.apiVersion) continue;
      installedWallets.push(wallet);
    }

    const updatedPreWallets = wallets.map((preWallet) => {
      const matchingWallet = installedWallets.find((provider) =>
        provider.name.toLowerCase().includes(preWallet.name.toLowerCase())
      );

      return {
        ...preWallet,
        ...(matchingWallet && { enable: matchingWallet.enable }),
      };
    });

    // Find wallets that are installed but not in SUPPORTEDWALLETS
    const unmatchedWallets = installedWallets.filter((installedWallet) => {
      return !wallets.some((preWallet) =>
        installedWallet.name
          .toLowerCase()
          .includes(preWallet.name.toLowerCase())
      );
    });

    // Combine both lists: pre-wallets first, then unmatched wallets
    const allWallets = [...updatedPreWallets, ...unmatchedWallets];

    setWallets(allWallets);
  }, []);

  async function onConnectWallet(wallet: Wallet) {
    setConnecting(true);
    setIsOpen(false);
    try {
      if (!lucid) throw "Uninitialized Lucid!!!";

      const api = await wallet.enable();

      lucid.selectWallet.fromAPI(api);

      const address = await lucid.wallet().address();
      const balance = parseInt(await api.getBalance());

      setWalletConnection((prev) => {
        return { ...prev, wallet, address, balance };
      });
    } catch (error) {
      setConnecting(false);
      handleError(error);
    }
    setConnecting(false);
  }

  function disconnect() {
    setWalletConnection((prev) => {
      return {
        ...prev,
        wallet: undefined,
        address: "",
        balance: undefined,
      };
    });
  }

  return (
    <div className="">
      {address ? (
        <Button variant="outline" onClick={disconnect}>
          <LogOut />
          Disconnect
        </Button>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button disabled={connecting}>
              {connecting ? (
                <>
                  <LoaderCircle className="animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <WalletIcon />
                  Connect Wallet
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose a wallet to connect to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 py-4 w-full">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  className="w-full"
                  disabled={!wallet.enable}
                  onClick={() => onConnectWallet(wallet)}
                >
                  <Image
                    alt={wallet.name}
                    height={20}
                    src={wallet.icon}
                    width={20}
                  />
                  {wallet.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
