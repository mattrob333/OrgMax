'use client'

import { useState, useEffect } from 'react'
import { User, Save, Bot, Globe } from 'lucide-react'
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

  // Detect user's timezone on component mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetectedTimezone(detected)
    
    // If user hasn't set a timezone yet, use detected one
    if (!user.timezone) {
      setTimezone(detected)
    }
  }, [user.timezone])

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
    </div>
  )
} 