import { createContext, Dispatch, SetStateAction, useContext } from 'react'
import { Address, LucidEvolution } from '@lucid-evolution/lucid'

import { Wallet } from '@/types/cardano'

export type WalletConnection = {
  lucid?: LucidEvolution
  wallet?: Wallet
  address?: Address
  balance?: number
}

export const WalletContext = createContext<
  [WalletConnection, Dispatch<SetStateAction<WalletConnection>>]
>([{}, () => {}])
export const useWallet = () => useContext(WalletContext)