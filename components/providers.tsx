'use client'

import { useEffect } from 'react'
import { FrameProvider } from '@/components/farcaster-provider'
import { WalletProvider } from '@/components/wallet-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const shouldRefreshForError = (message?: string) => {
      return Boolean(message && message.toLowerCase().includes('connector.getchainid is not a function'))
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason
      const message = typeof reason === 'string' ? reason : reason?.message
      if (shouldRefreshForError(message)) {
        window.location.reload()
      }
    }

    const handleError = (event: ErrorEvent) => {
      if (shouldRefreshForError(event.message)) {
        window.location.reload()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <WalletProvider>
      <FrameProvider>{children}</FrameProvider>
    </WalletProvider>
  )
}
