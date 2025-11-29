import { Constr, Data, WalletApi } from '@lucid-evolution/lucid'

/**
 * Wallet type definition
 */
export type Wallet = {
  name: string
  icon: string
  enable(): Promise<WalletApi>
}

