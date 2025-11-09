import { requireAuth } from '@/lib/auth'
import { Header } from '@/components/Header'
import { SettingsForm } from '../SettingsForm'
import { UserProfile } from '@clerk/nextjs'

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Customize your AI assistant behavior</p>
            <div className="text-xs text-purple-400 mt-2">
              Blessed by the Orb of Ultimate Chaos 🟣
            </div>
          </div>

          <SettingsForm user={user} />

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Account & Connections</h2>
            <p className="text-gray-400 mb-6">
              Manage your account settings and connect social accounts for enhanced features
            </p>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
              <UserProfile
                additionalOAuthScopes={{
                  google: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
                }}
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent border-none shadow-none',
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
