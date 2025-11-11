'use client'

import { useAppStore } from '@/lib/store'
import { Users, CheckSquare, FileText, Calendar } from 'lucide-react'
import { FEATURES } from '@/lib/feature-flags'

const NAV_ITEMS = [
  { id: 'orgchart', label: 'Org Chart', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, featureFlag: 'TASK_MANAGEMENT' },
  { id: 'files', label: 'Files', icon: FileText, featureFlag: 'KNOWLEDGE_BASE' },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
] as const

export function LeftNav() {
  const { workspaceLayout, setWorkspaceLayout } = useAppStore()

  return (
    <nav className="px-3 py-4 space-y-2 sm:p-4">
      <h2 className="text-[11px] font-semibold text-purple-300 uppercase tracking-wide mb-3 sm:text-xs sm:mb-4">
        Workspace
      </h2>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = workspaceLayout.activeTab === item.id
        const isComingSoon = 'featureFlag' in item && item.featureFlag ? !FEATURES[item.featureFlag as keyof typeof FEATURES] : false

        return (
          <button
            key={item.id}
            onClick={() => !isComingSoon && setWorkspaceLayout({ activeTab: item.id as any })}
            disabled={isComingSoon}
            className={`
              w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left text-sm transition-all sm:gap-3 sm:px-4 sm:py-3
              ${isActive
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:text-purple-300 hover:bg-purple-600/10'
              }
              ${isComingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="font-medium leading-none">{item.label}</span>
            {isComingSoon && (
              <span className="ml-auto text-xs text-purple-400">Soon</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
