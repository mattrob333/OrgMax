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
          colorPrimary: '#C4F82A',
          colorBackground: '#050505',
          colorInputBackground: 'rgba(255,255,255,0.06)',
          colorInputText: '#F5F5F5',
        },
        elements: {
          formButtonPrimary: 'bg-[#C4F82A] hover:bg-[#A8D622] text-slate-950 font-semibold orb-glow',
          card: 'bg-white/5 backdrop-blur-xl border border-white/10 orb-glow',
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