import { BeginIcon, EternlIcon, NamiIcon, VesprIcon, YoroiIcon } from './icons'

import { Wallet } from '@/types/cardano'

export const SUPPORTEDWALLETS: Wallet[] = [
  {
    name: 'Begin',
    icon: BeginIcon,
    enable: async () => {
      if (typeof window !== 'undefined')
        window.open('https://begin.is/', '_blank')
      throw 'wallet not found'
    },
  },
  {
    name: 'Eternl',
    icon: EternlIcon,
    enable: async () => {
      if (typeof window !== 'undefined')
        window.open('https://eternl.io/', '_blank')

      throw 'wallet not found'
    },
  },
  {
    name: 'Nami',
    icon: NamiIcon,
    enable: async () => {
      if (typeof window !== 'undefined')
        window.open('https://www.namiwallet.io/', '_blank')
      throw 'wallet not found'
    },
  },
  {
    name: 'Vespr',
    icon: VesprIcon,
    enable: async () => {
      if (typeof window !== 'undefined')
        window.open('https://vespr.xyz/', '_blank')
      throw 'wallet not found'
    },
  },
  {
    name: 'yoroi',
    icon: YoroiIcon,
    enable: async () => {
      if (typeof window !== 'undefined')
        window.open('https://yoroi-wallet.com/', '_blank')
      throw 'wallet not found'
    },
  },
]