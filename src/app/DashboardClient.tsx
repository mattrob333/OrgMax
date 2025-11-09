'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { OrgChart } from '@/components/OrgChart'
import { ChatPanel } from '@/components/ChatPanel'
import { ChatHistoryModal } from '@/components/ChatHistoryModal'
import { CalendarView } from '@/components/CalendarView'
import { ExtendedUser } from '@/types'
import { AdminStatus } from '@/lib/orgchart'
import { Card } from '@/components/ui/Card'
import { useRequireScope } from '@/lib/use-require-scope'
import { Users, Calendar } from 'lucide-react'
import { FEATURES } from '@/lib/feature-flags'

// Workspace components
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { LeftNav } from '@/components/workspace/LeftNav'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'
import { CopilotPanel } from '@/components/workspace/CopilotPanel'

interface DashboardClientProps {
  employees: ExtendedUser[]
  currentUserId: string
  adminStatus: AdminStatus
  currentUser?: ExtendedUser
}

export function DashboardClient({ employees, currentUserId, adminStatus, currentUser }: DashboardClientProps) {
  const { hasScope, isLoading, error, needsGoogleAuth, needsReauth, handleSignInWithGoogle, handleReauthorize } = useRequireScope("https://www.googleapis.com/auth/calendar.readonly")
  const setEmployees = useAppStore(state => state.setEmployees)
  const { chatHistoryId, isChatHistoryModalOpen, setIsChatHistoryModalOpen } = useAppStore()
  const [currentView, setCurrentView] = useState<'orgchart' | 'calendar'>('orgchart')
  const [viewingCalendarUser, setViewingCalendarUser] = useState<ExtendedUser | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [employeeData, setEmployeeData] = useState(employees)

  const handleCalendarClick = (user: ExtendedUser) => {
    setViewingCalendarUser(user)
    setCurrentView('calendar')
  }

  // Function to refresh employee data with smooth transition
  const refreshEmployeeData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/employees/refresh', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const { employees: newEmployees, adminStatus: newAdminStatus } = await response.json()
        
        // Add fade out effect
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setEmployeeData(newEmployees)
        
        // Add fade in effect  
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Failed to refresh employee data:', error)
      // Fallback to page reload if API fails
      window.location.reload()
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // If we have a floating admin, add them to the employees list for chat functionality
    let employeesWithAdmin = employeeData
    if (adminStatus.adminUser && adminStatus.needsFloatingNode) {
      employeesWithAdmin = [...employeeData, adminStatus.adminUser]
    }
    setEmployees(employeesWithAdmin)
  }, [employeeData, adminStatus, setEmployees])

  // Update local state when props change (for initial load and external updates)
  useEffect(() => {
    setEmployeeData(employees)
  }, [employees])

  // Sync calendar connection status on load (but don't show loading unless needed)
  useEffect(() => {
    const syncCalendarStatus = async () => {
      try {
        await fetch('/api/user/sync-calendar', { method: 'POST' })
        // Only refresh if calendar status actually changed - check response
        const response = await fetch('/api/employees/refresh', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (response.ok) {
          const { employees: newEmployees } = await response.json()
          // Quietly update without showing loading - this is just a sync
          setEmployeeData(newEmployees)
        }
      } catch (error) {
        console.error('Failed to sync calendar status:', error)
      }
    }

    // Only sync once on load if we suspect calendar status might be stale
    if (currentUser && typeof window !== 'undefined' && !sessionStorage.getItem('calendar-synced')) {
      sessionStorage.setItem('calendar-synced', 'true')
      syncCalendarStatus()
    }
  }, [currentUser])

  // Listen for employee data updates from other parts of the app (like CSV uploads)
  useEffect(() => {
    const handleEmployeeDataUpdate = () => {
      refreshEmployeeData()
    }

    window.addEventListener('employeeDataUpdated', handleEmployeeDataUpdate)
    return () => {
      window.removeEventListener('employeeDataUpdated', handleEmployeeDataUpdate)
    }
  }, [refreshEmployeeData])

  // Update viewingCalendarUser when employeeData changes (for calendar connection status updates)
  useEffect(() => {
    if (viewingCalendarUser) {
      const updatedUser = employeeData.find(emp => emp.id === viewingCalendarUser.id)
      if (updatedUser && updatedUser.calendarConnected !== viewingCalendarUser.calendarConnected) {
        console.log(`Calendar status updated for ${updatedUser.firstName}: ${updatedUser.calendarConnected}`)
        setViewingCalendarUser(updatedUser)
      }
    }
  }, [employeeData, viewingCalendarUser])

  // Show reauth flow if needed - but don't block if user wants to skip
  if (needsReauth) {
    return (
      <div className="min-h-full flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <Card className="relative">
            <div className="relative mb-10">
              <div className="gradient-orb mx-auto flex h-24 w-24 items-center justify-center rounded-3xl shadow-xl shadow-purple-500/30 transition-transform hover:scale-105">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-500">
                  <span className="text-3xl font-light text-white">🔐</span>
                </div>
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 opacity-20 blur-lg animate-pulse"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Calendar Permission Required</h2>
            <p className="text-slate-400 mb-6">
              We need additional permissions to access your calendar for meeting scheduling.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleReauthorize}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-yellow-500/30"
              >
                Grant Calendar Permission
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Skip for Now
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <Card className="relative">
            {/* Orb icon with subtle animation */}
            <div className="relative mb-10">
              <div className="gradient-orb mx-auto flex h-24 w-24 items-center justify-center rounded-3xl shadow-xl shadow-purple-500/30 transition-transform hover:scale-105">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-300 to-purple-500">
                  <span className="text-3xl font-light text-white">O</span>
                </div>
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-lg animate-pulse"></div>
            </div>

            {/* Typography with proper hierarchy */}
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to OrgChart AI</h2>
            <p className="text-slate-400 mb-8">
              Your organizational chart is empty. Ask your administrator to upload employee data to get started.
            </p>

            {/* Action button */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                Awaiting employee data
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // NEW: Use workspace shell if feature flag enabled
  if (FEATURES.WORKSPACE_MODE) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <WorkspaceShell
          leftNav={<LeftNav />}
          mainContent={
            <WorkspaceTabs
              employees={employeeData}
              adminStatus={adminStatus}
              currentUser={currentUser}
              onCalendarClick={handleCalendarClick}
              onRefresh={refreshEmployeeData}
            />
          }
          rightPanel={<CopilotPanel />}
        />

        <ChatPanel />

        <ChatHistoryModal
          chatId={chatHistoryId}
          isOpen={isChatHistoryModalOpen}
          onClose={() => setIsChatHistoryModalOpen(false)}
        />
      </div>
    )
  }

  // EXISTING: Keep old UI for backward compatibility
  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 relative flex flex-col">
        {/* Navigation tabs */}
        <div className="flex-shrink-0 border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => setCurrentView('orgchart')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === 'orgchart'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-gray-400 hover:text-purple-300 hover:bg-purple-600/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Organization Chart</span>
            </button>
            {currentUser && (
              <button
                onClick={() => {
                  setViewingCalendarUser(currentUser)
                  setCurrentView('calendar')
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'calendar'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400 hover:text-purple-300 hover:bg-purple-600/10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {viewingCalendarUser && viewingCalendarUser.id !== currentUser.id 
                    ? `${viewingCalendarUser.firstName}'s Calendar` 
                    : 'My Calendar'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 relative">
          {/* Loading overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="text-purple-300 font-medium">Updating organization chart...</p>
              </div>
            </div>
          )}
          
          {/* Main content with fade transition */}
          <div className={`h-full transition-opacity duration-300 ${isRefreshing ? 'opacity-30' : 'opacity-100'}`}>
            {currentView === 'orgchart' ? (
              <OrgChart 
                employees={employeeData} 
                adminStatus={adminStatus} 
                currentUser={currentUser}
                onCalendarClick={handleCalendarClick}
                onRefresh={refreshEmployeeData}
              />
            ) : (
              viewingCalendarUser && <CalendarView user={viewingCalendarUser} className="h-full" />
            )}
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <ChatPanel />
      
      {/* Chat history modal */}
      <ChatHistoryModal 
        chatId={chatHistoryId}
        isOpen={isChatHistoryModalOpen}
        onClose={() => setIsChatHistoryModalOpen(false)}
      />
    </div>
  )
}