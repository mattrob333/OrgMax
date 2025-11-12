'use client'

import { useState, useEffect } from 'react'
import { User, Save, Bot, Globe, Video, Check, X, ExternalLink, Loader2 } from 'lucide-react'
import { ExtendedUser } from '@/types'

interface SettingsFormProps {
  user: ExtendedUser
}

// Common timezone options
const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

export function SettingsForm({ user }: SettingsFormProps) {
  const [customPrompt, setCustomPrompt] = useState(user.customPrompt || '')
  const [timezone, setTimezone] = useState(user.timezone || 'UTC')
  const [detectedTimezone, setDetectedTimezone] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Fireflies integration state
  const [firefliesApiKey, setFirefliesApiKey] = useState('')
  const [firefliesConnected, setFirefliesConnected] = useState(false)
  const [firefliesLastSync, setFirefliesLastSync] = useState<Date | null>(null)
  const [testingFireflies, setTestingFireflies] = useState(false)
  const [firefliesStatus, setFirefliesStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [firefliesError, setFirefliesError] = useState('')

  // Detect user's timezone on component mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetectedTimezone(detected)

    // If user hasn't set a timezone yet, use detected one
    if (!user.timezone) {
      setTimezone(detected)
    }
  }, [user.timezone])

  // Load Fireflies connection status on mount
  useEffect(() => {
    const loadFirefliesStatus = async () => {
      try {
        const response = await fetch('/api/settings/fireflies')
        if (response.ok) {
          const data = await response.json()
          setFirefliesConnected(data.connected)
          if (data.lastSync) {
            setFirefliesLastSync(new Date(data.lastSync))
          }
        }
      } catch (error) {
        console.error('Failed to load Fireflies status:', error)
      }
    }

    loadFirefliesStatus()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch('/api/settings/update-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customPrompt, timezone }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleFirefliesSave = async () => {
    if (!firefliesApiKey.trim()) {
      setFirefliesError('Please enter an API key')
      setFirefliesStatus('error')
      return
    }

    setTestingFireflies(true)
    setFirefliesStatus('idle')
    setFirefliesError('')

    try {
      const response = await fetch('/api/settings/fireflies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: firefliesApiKey }),
      })

      const data = await response.json()

      if (response.ok) {
        setFirefliesStatus('success')
        setFirefliesConnected(true)
        setFirefliesLastSync(new Date())
        setFirefliesApiKey('') // Clear input after saving
        setTimeout(() => setFirefliesStatus('idle'), 3000)
      } else {
        setFirefliesStatus('error')
        setFirefliesError(data.error || 'Failed to connect to Fireflies')
      }
    } catch (error) {
      setFirefliesStatus('error')
      setFirefliesError('Failed to save Fireflies settings')
    } finally {
      setTestingFireflies(false)
    }
  }

  const handleFirefliesDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Fireflies? This will remove your API key.')) {
      return
    }

    try {
      const response = await fetch('/api/settings/fireflies', {
        method: 'DELETE',
      })

      if (response.ok) {
        setFirefliesConnected(false)
        setFirefliesLastSync(null)
        setFirefliesApiKey('')
        setFirefliesStatus('success')
        setTimeout(() => setFirefliesStatus('idle'), 3000)
      }
    } catch (error) {
      setFirefliesError('Failed to disconnect Fireflies')
      setFirefliesStatus('error')
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 orb-glow">
      <div className="flex items-center space-x-3 mb-6">
        <Bot className="text-purple-400" size={24} />
        <h2 className="text-xl font-semibold text-white">AI Assistant Customization</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-300 mb-2">
            Custom Instructions
          </label>
          <p className="text-sm text-gray-400 mb-3">
            These instructions will be added to your AI assistant to customize how it responds when others chat with you.
          </p>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., I prefer informal communication, I'm available for quick questions during business hours, I specialize in frontend development..."
            rows={6}
            className="w-full bg-gray-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {customPrompt.length}/500 characters
          </p>
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
            <Globe className="inline w-4 h-4 mr-1" />
            Timezone
          </label>
          <p className="text-sm text-gray-400 mb-3">
            This timezone will be used for all calendar events and scheduling.
            {detectedTimezone && (
              <span className="block text-purple-400 mt-1">
                Detected: {detectedTimezone}
              </span>
            )}
          </p>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-gray-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {/* Add detected timezone if not in options */}
            {detectedTimezone && !TIMEZONE_OPTIONS.includes(detectedTimezone) && (
              <option value={detectedTimezone}>{detectedTimezone} (Detected)</option>
            )}
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz} {tz === detectedTimezone ? '(Detected)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Settings saved successfully</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-sm">Failed to save settings</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || customPrompt.length > 500}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors orb-glow flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
        <h3 className="text-white font-medium mb-2 flex items-center">
          <User className="text-purple-400 mr-2" size={16} />
          Preview: How others will see your AI assistant
        </h3>
        <div className="text-sm text-gray-400">
          <p className="mb-2">
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </p>
          <p className="mb-2">
            <strong>Title:</strong> {user.title || 'Not set'}
          </p>
          <p className="mb-2">
            <strong>Department:</strong> {user.department || 'Not set'}
          </p>
          {customPrompt && (
            <p>
              <strong>Custom Instructions:</strong> {customPrompt}
            </p>
          )}
        </div>
      </div>

      {/* Fireflies Integration Section */}
      <div className="mt-6 bg-gray-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 orb-glow">
        <div className="flex items-center space-x-3 mb-6">
          <Video className="text-purple-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Fireflies Integration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="firefliesApiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Fireflies API Key
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Connect your Fireflies account to access meeting transcripts and summaries in the AI copilot.
              <a
                href="https://app.fireflies.ai/integrations/custom/fireflies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 ml-1 inline-flex items-center hover:text-purple-300"
              >
                Get your API key <ExternalLink size={12} className="ml-1" />
              </a>
            </p>

            {firefliesConnected ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check size={16} />
                    <span>Connected to Fireflies</span>
                  </div>
                  {firefliesLastSync && (
                    <span className="text-gray-400">
                      • Last synced: {firefliesLastSync.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleFirefliesDisconnect}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Disconnect Fireflies
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  id="firefliesApiKey"
                  value={firefliesApiKey}
                  onChange={(e) => setFirefliesApiKey(e.target.value)}
                  placeholder="Enter your Fireflies API key"
                  className="w-full bg-gray-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                {firefliesError && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <X size={16} />
                    <span>{firefliesError}</span>
                  </div>
                )}

                {firefliesStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-400 text-sm">
                    <Check size={16} />
                    <span>Fireflies connected successfully!</span>
                  </div>
                )}

                <button
                  onClick={handleFirefliesSave}
                  disabled={testingFireflies || !firefliesApiKey.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {testingFireflies ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Testing Connection...</span>
                    </>
                  ) : (
                    <>
                      <Video size={16} />
                      <span>Connect Fireflies</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg border border-neutral-700">
            <h4 className="text-sm font-medium text-white mb-2">What is Fireflies?</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Fireflies.ai is an AI meeting assistant that records, transcribes, and summarizes your meetings.
              Connect it to OrgMax to bring meeting insights directly into your AI copilot for collaborative task creation and team discussions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 