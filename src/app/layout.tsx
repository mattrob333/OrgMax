import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'OrgChart AI - Blessed by the Orb',
  description: 'AI-Powered Organizational Chart with Chat Assistants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#e2e8f0',
        },
        elements: {
          formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white orb-glow',
          card: 'bg-gray-800/50 backdrop-blur-sm border border-neutral-700 orb-glow',
        }
      }}
    >
      <html lang="en" className="dark">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
} 