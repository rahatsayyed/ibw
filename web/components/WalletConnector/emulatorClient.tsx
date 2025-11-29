'use client'

import dynamic from 'next/dynamic'
const EmulatorConnectors = dynamic(() => import('./emulator'), { ssr: false })

export default function EmulatorConnector() {
  return <EmulatorConnectors />
}