import { Lucid } from '@lucid-evolution/lucid'

import { NETWORK, PROVIDER } from '@/config'
import { WalletConnection } from '@/context/walletContext'

export const mkLucid = async (
  setWalletConnection: (value: React.SetStateAction<WalletConnection>) => void
): Promise<void> => {
  try {
    const lucidInstance = await Lucid(PROVIDER, NETWORK)

    setWalletConnection((prev) => ({
      ...prev,
      lucid: lucidInstance,
    }))
  } catch (error) {
    console.error('Error initializing Lucid:', error)
  }
}