import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Providers } from '@/components/providers'
import { ThemeProvider } from 'styled-components'

export const metadata: Metadata = {
  title: 'Base Rocket',
  description: 'A mobile-native HTML5 Rocket launching game featuring an astronaut character',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <ThemeProvider> */}
          <Providers>{children}</Providers>
        {/* </ThemeProvider > */}
      </body>
    </html>
  )
}