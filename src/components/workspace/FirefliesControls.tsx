'use client'

import { useState } from 'react'
import { Video, ChevronDown, Loader2 } from 'lucide-react'

interface FirefliesControlsProps {
  onActionTriggered: (prompt: string) => void
  isLoading: boolean
}

export function FirefliesControls({ onActionTriggered, isLoading }: FirefliesControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const handleAction = (action: string, prompt: string) => {
    setLastAction(action)
    onActionTriggered(prompt)
    setIsOpen(false)
  }

  const actions = [
    {
      id: 'get-last',
      label: 'Get Last Meeting',
      description: 'Fetch the most recent meeting transcript',
      prompt: 'Use the getLastMeeting tool to retrieve my most recent Fireflies meeting transcript. Then analyze it and provide: 1) Meeting title and date, 2) List of speakers/attendees, 3) Key discussion points and summary, 4) Action items extracted from the transcript, 5) Any important keywords or topics mentioned.',
    },
    {
      id: 'sync',
      label: 'Sync Recent Meetings',
      description: 'Import meetings from Fireflies to database',
      prompt: 'Sync the 10 most recent meetings from Fireflies AI to the database.',
      adminOnly: true,
    },
    {
      id: 'view-meetings',
      label: 'View Synced Meetings',
      description: 'List meetings in the database',
      prompt: 'Show me a list of all synced meetings from Fireflies, including their titles, dates, speakers, and task counts.',
    },
  ]

  return (
    <div className="relative">
      {/* Fireflies Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/12 bg-brand-accent/10 text-brand-accent hover:bg-[var(--orb-purple)]/20 hover:border-[var(--orb-purple)]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Fireflies AI Actions"
      >
        {isLoading && lastAction ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
        <span className="font-medium">Fireflies</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/12 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 bg-[var(--orb-purple)]/20 border-b border-white/12">
            <h3 className="text-sm font-semibold text-brand-accent">Fireflies AI Actions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage meeting transcripts</p>
          </div>

          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.label, action.prompt)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 text-left hover:bg-brand-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-700/50 last:border-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{action.label}</span>
                      {action.adminOnly && (
                        <span className="px-1.5 py-0.5 text-xs bg-orange-600/20 text-orange-300 rounded border border-orange-500/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="px-3 py-2 bg-[#0f0f0f]/80 border-t border-white/12">
            <p className="text-xs text-gray-500">
              Powered by Fireflies AI
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
