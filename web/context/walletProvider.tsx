// Wallet Provider to pass the wallet context
'use client'

import { useState } from 'react'

import { WalletConnection, WalletContext } from './walletContext'

export default function WalletProvider(props: { children: React.ReactNode }) {
  return (
    <WalletContext.Provider value={useState<WalletConnection>({})}>
      {props.children}
    </WalletContext.Provider>
  )
}