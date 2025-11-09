'use client'

import { useAppStore } from '@/lib/store'
import { ExtendedUser } from '@/types'
import { AdminStatus } from '@/lib/orgchart'
import { OrgChart } from '@/components/OrgChart'
import { CalendarView } from '@/components/CalendarView'
import { TaskPanel } from '@/components/tasks/TaskPanel'
import { DocumentLibrary } from '@/components/documents/DocumentLibrary'
import { FEATURES } from '@/lib/feature-flags'

interface WorkspaceTabsProps {
  employees: ExtendedUser[]
  adminStatus: AdminStatus
  currentUser?: ExtendedUser
  onCalendarClick: (user: ExtendedUser) => void
  onRefresh: () => void
}

export function WorkspaceTabs({
  employees,
  adminStatus,
  currentUser,
  onCalendarClick,
  onRefresh,
}: WorkspaceTabsProps) {
  const { workspaceLayout } = useAppStore()

  return (
    <div className="h-full">
      {workspaceLayout.activeTab === 'orgchart' && (
        <OrgChart
          employees={employees}
          adminStatus={adminStatus}
          currentUser={currentUser}
          onCalendarClick={onCalendarClick}
          onRefresh={onRefresh}
        />
      )}

      {workspaceLayout.activeTab === 'calendar' && currentUser && (
        <CalendarView user={currentUser} className="h-full" />
      )}

      {workspaceLayout.activeTab === 'tasks' && (
        FEATURES.TASK_MANAGEMENT ? (
          <TaskPanel />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Tasks Coming Soon</h3>
              <p className="text-gray-400">Task management will be available in Phase 2</p>
            </div>
          </div>
        )
      )}

      {workspaceLayout.activeTab === 'files' && (
        FEATURES.KNOWLEDGE_BASE ? (
          <DocumentLibrary />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Files Coming Soon</h3>
              <p className="text-gray-400">Knowledge base will be available in Phase 3</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
