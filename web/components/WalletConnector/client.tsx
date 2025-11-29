'use client'

import dynamic from 'next/dynamic'
const WalletComponent = dynamic(() => import('./connector'), { ssr: false })

export default function WalletConnector() {
  return <WalletComponent />
}