# UPGRADE ROADMAP: OrgChart AI → Collaborative Workspace Platform

**Last Updated:** January 2025
**Status:** Phase 1-4 Completed ✅ | Phase 5 In Progress ⚠️
**Timeline:** MVP 9-11 weeks | Full Implementation 16-20 weeks

---

## Executive Summary

This document outlines the transformation of OrgChart AI from a **single-purpose employee chat application** to a **collaborative workspace platform** with task management, shared knowledge base, and context-aware AI copilot.

### Key Transformation

```
CURRENT:                          TARGET:
┌─────────────────┐              ┌────────────────────────────────┐
│ Org Chart View  │              │ ┌────┬─────────────┬─────────┐ │
│ Calendar View   │     →        │ │Nav │  Workspace  │ Copilot │ │
│ Chat Modal      │              │ │Bar │   Tabs      │  Panel  │ │
└─────────────────┘              │ └────┴─────────────┴─────────┘ │
                                 └────────────────────────────────┘
```

### Timeline Estimates

| Phase | Features | Duration | Status |
|-------|----------|----------|--------|
| **Phase 1** | Workspace Shell | 4-6 weeks | ✅ **COMPLETED** |
| **Phase 2** | Task Management | 3-4 weeks | ✅ **COMPLETED** |
| **Phase 3** | Knowledge Base | 3-4 weeks | ✅ **COMPLETED** |
| **Phase 4** | Copilot Panel | 2-3 weeks | ✅ **COMPLETED** |
| **Phase 5** | @mentions + Transcripts | 2 weeks | ⚠️ **IN PROGRESS** (@mentions done, transcripts pending) |
| **Phase 6** | Polish + Performance | 2-3 weeks | 🔲 **PLANNED** |
| **TOTAL** | Full Implementation | 16-20 weeks | **~12 weeks completed** |
| **MVP** | Shell + Tasks + Copilot | 9-11 weeks | ✅ **DELIVERED** |

### Critical Success Factors

1. ✅ **Implement Workspace Shell FIRST** - COMPLETED
2. ✅ **Use Feature Flags** - IMPLEMENTED (.env controls all features)
3. ✅ **Maintain Backward Compatibility** - IMPLEMENTED (parallel UI support)
4. ✅ **Test at Every Checkpoint** - ONGOING
5. ⚠️ **Start with Manual Transcripts** - PLANNED (Google Meet API unavailable)

---

## 🎉 Completed Features Summary

### ✅ Phase 1: Workspace Shell (COMPLETED)
**Implementation Status:** Fully functional workspace with resizable panels

**Completed Components:**
- `WorkspaceShell.tsx` - Multi-panel layout with react-resizable-panels
- `LeftNav.tsx` - Collapsible navigation sidebar
- `WorkspaceTabs.tsx` - Tab-based content switching (Org Chart, Calendar, Tasks, Files)
- `CopilotPanel.tsx` - Right-side AI assistant panel

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_WORKSPACE=true` - Enabled

**Key Features:**
- Resizable left sidebar (15-30% width)
- Resizable right copilot panel (20-40% width)
- Collapsible panels with smooth animations
- Layout persistence to localStorage
- Backward compatibility maintained (old UI still accessible)

---

### ✅ Phase 2: Task Management (COMPLETED)
**Implementation Status:** Full task management system with Kanban board

**Database Models:**
- `Task` - Core task entity with status, priority, assignments, AI metadata
- `TaskComment` - Comment threads on tasks
- `TaskDocument` - Many-to-many linking tasks to documents
- `TaskMention` - @mention notifications system

**API Routes:**
- `POST /api/tasks` - Create task
- `GET /api/tasks?filter=my|assigned|created|all&status=TODO|IN_PROGRESS|REVIEW|DONE` - List tasks
- `GET /api/tasks/[id]` - Get single task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/comments` - Add comment
- `POST /api/tasks/bulk-create` - Bulk create tasks

**UI Components:**
- `TaskPanel.tsx` - Kanban board with 4 columns (TODO, IN_PROGRESS, REVIEW, DONE)
- `TaskCreateModal.tsx` - Task creation dialog
- `TaskCard.tsx` - Individual task cards with drag-and-drop
- Task filtering (my tasks, assigned to me, created by me, all)
- Task assignment to employees
- Comment threads
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Due date tracking

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_TASKS=true` - Enabled

**Advanced Features:**
- AI-generated tasks (`aiGenerated`, `sourceType`, `aiContext` fields)
- Task source tracking (MANUAL, COPILOT, TRANSCRIPT, DOCUMENT, EMAIL)
- Document linking (tasks can reference/be created from documents)
- Notifications for task assignment, completion, and comments

---

### ✅ Phase 3: Knowledge Base (COMPLETED)
**Implementation Status:** AI-enhanced document library with sharing

**Database Model:**
- `Document` - Enhanced with scope, AI analysis, and sharing capabilities
  - `scope`: PERSONAL, TEAM, COMPANY
  - `category`: Categorization (e.g., "Meeting Transcripts", "Policies")
  - `summary`: AI-generated summary
  - `extractedEntities`: AI-extracted people, dates, action items
  - `sharedWith`: Array of user IDs for fine-grained sharing
  - `metadata`: JSON field for additional data (uploadedBy, fileSize, tags, source)

**API Routes:**
- `POST /api/documents` - Upload document
- `GET /api/documents` - List accessible documents
- `GET /api/documents/[id]` - Get document
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `POST /api/documents/[id]/analyze` - Trigger AI analysis

**UI Components:**
- `DocumentLibrary.tsx` - Document browser with search and filters
- `DocumentUploadModal.tsx` - File upload with metadata
- `DocumentCard.tsx` - Document preview cards
- Document viewer with markdown rendering
- Access control UI (personal/team/company sharing)

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_DOCS=true` - Enabled

**Advanced Features:**
- AI-powered document analysis and summarization
- Entity extraction (people, dates, action items)
- Automatic task generation from documents
- Smart search across content and metadata
- Permission system (owner, shared users, team, company-wide)
- File type support (.txt, .md, future: .pdf)

**Note:** Implementation uses enhanced `Document` model instead of creating new `SharedDocument` model as originally planned. No separate Team model needed - scope-based sharing is simpler and more flexible.

---

### ✅ Phase 4: Copilot Panel (COMPLETED)
**Implementation Status:** Context-aware AI assistant panel

**Completed Components:**
- `CopilotPanel.tsx` - Persistent right-side panel
- Context-aware chat interface
- Workspace state integration

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_COPILOT=true` - Enabled

**Key Features:**
- Always-available AI assistant in right panel
- Context awareness of current workspace state
- Integration with existing chat infrastructure
- Smooth panel resize and collapse animations

---

### ⚠️ Phase 5: @mentions + Transcripts (IN PROGRESS)
**Implementation Status:** @mentions completed in database, UI pending; Transcripts planned

**Completed:**
- ✅ `TaskMention` model in database
- ✅ Database relations for mention tracking
- ✅ Notification system for mentions (`TASK_MENTIONED` type)

**Pending:**
- 🔲 Tiptap rich text editor integration
- 🔲 @mention autocomplete UI
- 🔲 Transcript model and upload system
- 🔲 Meeting transcript categorization
- 🔲 AI summarization of transcripts

**Feature Flags:**
- `NEXT_PUBLIC_FEATURE_MENTIONS=false` - Database ready, UI pending
- `NEXT_PUBLIC_FEATURE_TRANSCRIPTS=false` - Not implemented

---

## Current State Analysis

### Architecture Strengths ✅

**What We Can Build Upon:**
- **Solid Authentication**: Clerk with Google OAuth, webhook sync
- **Robust AI Infrastructure**: Vercel AI SDK with streaming, tool calling
- **Good Calendar Integration**: FreeBusy API, event creation, Meet links
- **Clean React Architecture**: Server/client split, proper state management
- **Extensible Database**: Prisma ORM with good schema design

### Critical Gaps ⚠️

**What Needs to Be Built:**

| Gap | Current State | Required |
|-----|---------------|----------|
| **Layout System** | Simple tab view | Multi-panel workspace with resize |
| **State Management** | 6 properties in Zustand | Task state, doc state, layout state |
| **Database Schema** | User, Chat, Message, Document, Notification | Task, Team, SharedDocument, Transcript |
| **Permission System** | Basic ADMIN/USER roles | RBAC, document visibility, task ownership |
| **Real-time Updates** | 60-second polling | WebSocket or SSE |
| **Testing** | No tests found | Unit, integration, E2E tests |

### Breaking Change Risk Assessment

| Feature | Breaking | Migration Strategy |
|---------|----------|-------------------|
| Workspace Shell | ✅ YES | Feature flag + parallel old/new UI |
| Task Management | ❌ NO | Additive schema changes only |
| Knowledge Base | ⚠️ MAYBE | Depends on Document migration approach |
| Copilot Panel | ❌ NO | Coexists with ChatPanel initially |
| @mention System | ❌ NO | Progressive enhancement |
| Transcripts | ❌ NO | New feature, zero conflicts |

---

## Phase 1: Workspace Foundation (4-6 weeks)

### Goal
Build workspace shell infrastructure without breaking existing functionality.

### Overview

Replace the simple tab-based UI with a professional multi-panel workspace:

```
┌──────────────────────────────────────────────────────┐
│ Header (existing)                                    │
├────────┬─────────────────────────────────┬──────────┤
│        │ ┌─────────────────────────────┐ │          │
│  Left  │ │   Main Workspace Tabs       │ │  Right   │
│  Nav   │ │   - Org Chart               │ │ Copilot  │
│  Bar   │ │   - My Tasks (future)       │ │  Panel   │
│        │ │   - Team Tasks (future)     │ │ (future) │
│  - Org │ │   - Files (future)          │ │          │
│  - Docs│ │                             │ │          │
│  - Task│ └─────────────────────────────┘ │          │
│        │                                 │          │
└────────┴─────────────────────────────────┴──────────┘
```

### Step 1.1: Install Dependencies

```bash
npm install react-resizable-panels
npm install @types/react --save-dev
```

**Why `react-resizable-panels`?**
- Zero dependencies, lightweight (10KB)
- Smooth resize with keyboard support
- Persist layout to localStorage
- Matches VS Code UX paradigm

### Step 1.2: Create Feature Flag System

Create `src/lib/feature-flags.ts`:

```typescript
export const FEATURES = {
  // Phase 1
  WORKSPACE_MODE: process.env.NEXT_PUBLIC_FEATURE_WORKSPACE === 'true',

  // Phase 2
  TASK_MANAGEMENT: process.env.NEXT_PUBLIC_FEATURE_TASKS === 'true',

  // Phase 3
  KNOWLEDGE_BASE: process.env.NEXT_PUBLIC_FEATURE_DOCS === 'true',

  // Phase 4
  COPILOT_PANEL: process.env.NEXT_PUBLIC_FEATURE_COPILOT === 'true',

  // Phase 5
  MENTIONS: process.env.NEXT_PUBLIC_FEATURE_MENTIONS === 'true',
  TRANSCRIPTS: process.env.NEXT_PUBLIC_FEATURE_TRANSCRIPTS === 'true',
} as const

export type FeatureFlag = keyof typeof FEATURES
```

Add to `.env.local`:

```bash
# Feature Flags (set to 'true' to enable)
NEXT_PUBLIC_FEATURE_WORKSPACE=false
NEXT_PUBLIC_FEATURE_TASKS=false
NEXT_PUBLIC_FEATURE_DOCS=false
NEXT_PUBLIC_FEATURE_COPILOT=false
NEXT_PUBLIC_FEATURE_MENTIONS=false
NEXT_PUBLIC_FEATURE_TRANSCRIPTS=false
```

### Step 1.3: Extend Zustand Store

Update `src/lib/store.ts`:

```typescript
import { create } from 'zustand'

// Existing types...

interface WorkspaceLayout {
  leftSidebarWidth: number
  rightPanelWidth: number
  leftSidebarCollapsed: boolean
  rightPanelCollapsed: boolean
  activeTab: 'orgchart' | 'tasks' | 'files' | 'calendar'
}

interface AppState {
  // Existing state...
  employees: ExtendedUser[]
  activeChatUserId: string | null
  isChatPanelOpen: boolean
  notifications: NotificationWithChat[]
  unreadCount: number
  isNotificationPanelOpen: boolean
  chatHistoryId: string | null
  isChatHistoryModalOpen: boolean

  // NEW: Workspace state
  workspaceLayout: WorkspaceLayout
  setWorkspaceLayout: (layout: Partial<WorkspaceLayout>) => void

  // NEW: Task state (Phase 2)
  tasks: Task[]
  setTasks: (tasks: Task[]) => void

  // Existing actions...
  setEmployees: (employees: ExtendedUser[]) => void
  setActiveChatUserId: (userId: string | null) => void
  // ... rest of existing actions
}

export const useAppStore = create<AppState>((set) => ({
  // Existing state...
  employees: [],
  activeChatUserId: null,
  isChatPanelOpen: false,
  notifications: [],
  unreadCount: 0,
  isNotificationPanelOpen: false,
  chatHistoryId: null,
  isChatHistoryModalOpen: false,

  // NEW: Default workspace layout
  workspaceLayout: {
    leftSidebarWidth: 250,
    rightPanelWidth: 400,
    leftSidebarCollapsed: false,
    rightPanelCollapsed: true, // Start collapsed
    activeTab: 'orgchart',
  },

  setWorkspaceLayout: (layout) =>
    set((state) => ({
      workspaceLayout: { ...state.workspaceLayout, ...layout },
    })),

  // NEW: Task state (empty for now)
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  // Existing actions...
  setEmployees: (employees) => set({ employees }),
  setActiveChatUserId: (userId) => set({ activeChatUserId: userId }),
  // ... rest of existing actions
}))
```

### Step 1.4: Create Workspace Shell Component

Create `src/components/workspace/WorkspaceShell.tsx`:

```typescript
'use client'

import { ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useAppStore } from '@/lib/store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WorkspaceShellProps {
  leftNav: ReactNode
  mainContent: ReactNode
  rightPanel?: ReactNode
}

export function WorkspaceShell({ leftNav, mainContent, rightPanel }: WorkspaceShellProps) {
  const { workspaceLayout, setWorkspaceLayout } = useAppStore()

  const toggleLeftSidebar = () => {
    setWorkspaceLayout({ leftSidebarCollapsed: !workspaceLayout.leftSidebarCollapsed })
  }

  const toggleRightPanel = () => {
    setWorkspaceLayout({ rightPanelCollapsed: !workspaceLayout.rightPanelCollapsed })
  }

  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Navigation Sidebar */}
        {!workspaceLayout.leftSidebarCollapsed && (
          <>
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="bg-gray-900/50 border-r border-purple-500/20"
            >
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {leftNav}
                </div>
                <button
                  onClick={toggleLeftSidebar}
                  className="p-2 border-t border-purple-500/20 hover:bg-purple-500/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-purple-300" />
                </button>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-purple-500/20 hover:bg-purple-500/40 transition-colors" />
          </>
        )}

        {/* Main Content Area */}
        <Panel defaultSize={workspaceLayout.leftSidebarCollapsed ? 100 : 60}>
          <div className="h-full flex flex-col">
            {workspaceLayout.leftSidebarCollapsed && (
              <button
                onClick={toggleLeftSidebar}
                className="absolute top-2 left-2 p-2 bg-gray-800 rounded-lg hover:bg-purple-500/20 transition-colors z-10"
              >
                <ChevronRight className="w-4 h-4 text-purple-300" />
              </button>
            )}
            {mainContent}
          </div>
        </Panel>

        {/* Right Copilot Panel (Future) */}
        {rightPanel && !workspaceLayout.rightPanelCollapsed && (
          <>
            <PanelResizeHandle className="w-1 bg-purple-500/20 hover:bg-purple-500/40 transition-colors" />
            <Panel
              defaultSize={25}
              minSize={20}
              maxSize={40}
              className="bg-gray-900/50 border-l border-purple-500/20"
            >
              <div className="h-full flex flex-col">
                <button
                  onClick={toggleRightPanel}
                  className="p-2 border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-purple-300" />
                </button>
                <div className="flex-1 overflow-y-auto">
                  {rightPanel}
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  )
}
```

### Step 1.5: Create Left Navigation Component

Create `src/components/workspace/LeftNav.tsx`:

```typescript
'use client'

import { useAppStore } from '@/lib/store'
import { Users, CheckSquare, FileText, Calendar } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'orgchart', label: 'Org Chart', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, comingSoon: true },
  { id: 'files', label: 'Files', icon: FileText, comingSoon: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
] as const

export function LeftNav() {
  const { workspaceLayout, setWorkspaceLayout } = useAppStore()

  return (
    <nav className="p-4 space-y-2">
      <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-4">
        Workspace
      </h2>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = workspaceLayout.activeTab === item.id

        return (
          <button
            key={item.id}
            onClick={() => !item.comingSoon && setWorkspaceLayout({ activeTab: item.id as any })}
            disabled={item.comingSoon}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
              ${isActive
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:text-purple-300 hover:bg-purple-600/10'
              }
              ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.comingSoon && (
              <span className="ml-auto text-xs text-purple-400">Soon</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

### Step 1.6: Create Main Workspace Tabs Component

Create `src/components/workspace/WorkspaceTabs.tsx`:

```typescript
'use client'

import { useAppStore } from '@/lib/store'
import { ExtendedUser } from '@/types'
import { AdminStatus } from '@/lib/orgchart'
import { OrgChart } from '@/components/OrgChart'
import { CalendarView } from '@/components/CalendarView'

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
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Tasks Coming Soon</h3>
            <p className="text-gray-400">Task management will be available in Phase 2</p>
          </div>
        </div>
      )}

      {workspaceLayout.activeTab === 'files' && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Files Coming Soon</h3>
            <p className="text-gray-400">Knowledge base will be available in Phase 3</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Step 1.7: Update DashboardClient to Use Workspace Shell

Modify `src/app/DashboardClient.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { ChatPanel } from '@/components/ChatPanel'
import { ChatHistoryModal } from '@/components/ChatHistoryModal'
import { ExtendedUser } from '@/types'
import { AdminStatus } from '@/lib/orgchart'
import { Card } from '@/components/ui/Card'
import { useRequireScope } from '@/lib/use-require-scope'
import { FEATURES } from '@/lib/feature-flags'

// NEW: Import workspace components
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { LeftNav } from '@/components/workspace/LeftNav'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'

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

  const refreshEmployeeData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/employees/refresh', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (response.ok) {
        const { employees: newEmployees } = await response.json()
        setEmployeeData(newEmployees)
      }
    } catch (error) {
      console.error('Failed to refresh employee data:', error)
      window.location.reload()
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let employeesWithAdmin = employeeData
    if (adminStatus.adminUser && adminStatus.needsFloatingNode) {
      employeesWithAdmin = [...employeeData, adminStatus.adminUser]
    }
    setEmployees(employeesWithAdmin)
  }, [employeeData, adminStatus, setEmployees])

  useEffect(() => {
    setEmployeeData(employees)
  }, [employees])

  // ... existing calendar sync effect ...

  useEffect(() => {
    const handleEmployeeDataUpdate = () => {
      refreshEmployeeData()
    }

    window.addEventListener('employeeDataUpdated', handleEmployeeDataUpdate)
    return () => {
      window.removeEventListener('employeeDataUpdated', handleEmployeeDataUpdate)
    }
  }, [refreshEmployeeData])

  useEffect(() => {
    if (viewingCalendarUser) {
      const updatedUser = employeeData.find(emp => emp.id === viewingCalendarUser.id)
      if (updatedUser && updatedUser.calendarConnected !== viewingCalendarUser.calendarConnected) {
        setViewingCalendarUser(updatedUser)
      }
    }
  }, [employeeData, viewingCalendarUser])

  // Reauth flow...
  if (needsReauth) {
    return (
      <div className="min-h-full flex items-center justify-center px-6 py-16">
        {/* ... existing reauth UI ... */}
      </div>
    )
  }

  // Empty state...
  if (employees.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center px-6 py-16">
        {/* ... existing empty state UI ... */}
      </div>
    )
  }

  // NEW: Use workspace shell if feature flag enabled
  if (FEATURES.WORKSPACE_MODE) {
    return (
      <>
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
          rightPanel={null} // Phase 4: Copilot panel
        />

        <ChatPanel />

        <ChatHistoryModal
          chatId={chatHistoryId}
          isOpen={isChatHistoryModalOpen}
          onClose={() => setIsChatHistoryModalOpen(false)}
        />
      </>
    )
  }

  // EXISTING: Keep old UI for backward compatibility
  return (
    <div className="flex h-full">
      {/* ... existing tab-based UI code ... */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-shrink-0 border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm">
          {/* ... existing tabs ... */}
        </div>

        <div className="flex-1 relative">
          {/* ... existing content ... */}
        </div>
      </div>

      <ChatPanel />

      <ChatHistoryModal
        chatId={chatHistoryId}
        isOpen={isChatHistoryModalOpen}
        onClose={() => setIsChatHistoryModalOpen(false)}
      />
    </div>
  )
}
```

### Step 1.8: Testing Checklist

**Before proceeding to Phase 2, verify:**

- [ ] Feature flag `NEXT_PUBLIC_FEATURE_WORKSPACE=false` shows old UI
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_WORKSPACE=true` shows workspace shell
- [ ] Left sidebar collapses/expands correctly
- [ ] Panel resizing works smoothly
- [ ] OrgChart tab displays existing org chart
- [ ] Calendar tab displays calendar view
- [ ] "Tasks" and "Files" tabs show coming soon message
- [ ] ChatPanel still opens/closes correctly
- [ ] Notifications still work
- [ ] Employee data refresh still works
- [ ] No console errors
- [ ] Layout persists on page reload (localStorage)

**Performance Checks:**
- [ ] No layout jank during resize
- [ ] Smooth transitions between tabs
- [ ] No memory leaks (check DevTools Memory tab)

---

## Phase 2: Task Management System (3-4 weeks)

### Goal
Add complete task management with assignments, comments, and Kanban board UI.

### Database Schema

Update `prisma/schema.prisma`:

```prisma
// Add to User model relations:
model User {
  // ... existing fields ...

  tasksCreated    Task[] @relation("TasksCreated")
  tasksAssigned   Task[] @relation("TasksAssigned")
  taskComments    TaskComment[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?    @db.Text
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?

  createdById  String
  assignedToId String?

  createdBy   User @relation("TasksCreated", fields: [createdById], references: [id])
  assignedTo  User? @relation("TasksAssigned", fields: [assignedToId], references: [id])

  comments    TaskComment[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([assignedToId])
  @@index([createdById])
  @@index([status])
  @@map("tasks")
}

model TaskComment {
  id      String @id @default(cuid())
  taskId  String
  userId  String
  content String @db.Text

  task    Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user    User @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@index([taskId])
  @@map("task_comments")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// Add to NotificationType enum:
enum NotificationType {
  CHAT_STARTED
  CHAT_ENDED
  MEETING_BOOKED
  CALENDAR_UPDATED
  TASK_ASSIGNED      // NEW
  TASK_COMPLETED     // NEW
  TASK_COMMENT       // NEW
}
```

**Run Migration:**

```bash
npm run db:generate
npm run db:push
```

### API Routes

Create `src/app/api/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
})

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') // 'my' | 'assigned' | 'created' | 'all'
    const status = searchParams.get('status') // 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

    let where: any = {}

    if (filter === 'assigned') {
      where.assignedToId = user.id
    } else if (filter === 'created') {
      where.createdById = user.id
    } else if (filter === 'my') {
      where.OR = [
        { assignedToId: user.id },
        { createdById: user.id },
      ]
    }

    if (status) {
      where.status = status
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// POST /api/tasks - Create task
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const body = await req.json()
    const validated = createTaskSchema.parse(body)

    const task = await db.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        createdById: user.id,
        assignedToId: validated.assignedToId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })

    // Create notification if assigned to someone
    if (task.assignedToId && task.assignedToId !== user.id) {
      await db.notification.create({
        data: {
          userId: task.assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `${user.firstName} ${user.lastName} assigned you: ${task.title}`,
          // Note: Need to add taskId field to Notification model or use generic JSON
        },
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Task creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

Create `src/app/api/tasks/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

// GET /api/tasks/[id] - Get single task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) return new NextResponse('Task not found', { status: 404 })

    // Permission check: only creator, assignee, or admin can view
    const canView =
      task.createdById === user.id ||
      task.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canView) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Task fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const existingTask = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator, assignee, or admin can update
    const canUpdate =
      existingTask.createdById === user.id ||
      existingTask.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canUpdate) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = updateTaskSchema.parse(body)

    const task = await db.task.update({
      where: { id: params.id },
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        assignedToId: validated.assignedToId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })

    // Create notification if status changed to DONE
    if (validated.status === 'DONE' && existingTask.status !== 'DONE') {
      if (existingTask.createdById !== user.id) {
        await db.notification.create({
          data: {
            userId: existingTask.createdById,
            type: 'TASK_COMPLETED',
            title: 'Task Completed',
            message: `${user.firstName} completed: ${task.title}`,
          },
        })
      }
    }

    // Create notification if reassigned
    if (
      validated.assignedToId &&
      validated.assignedToId !== existingTask.assignedToId &&
      validated.assignedToId !== user.id
    ) {
      await db.notification.create({
        data: {
          userId: validated.assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned to You',
          message: `${user.firstName} assigned you: ${task.title}`,
        },
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Task update error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator or admin can delete
    const canDelete = task.createdById === user.id || user.role === 'ADMIN'

    if (!canDelete) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task deletion error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

Create `src/app/api/tasks/[id]/comments/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

// POST /api/tasks/[id]/comments - Add comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator, assignee, or admin can comment
    const canComment =
      task.createdById === user.id ||
      task.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canComment) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = createCommentSchema.parse(body)

    const comment = await db.taskComment.create({
      data: {
        taskId: params.id,
        userId: user.id,
        content: validated.content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })

    // Notify task creator and assignee (if not the commenter)
    const notifyUserIds = new Set([task.createdById, task.assignedToId].filter(Boolean))
    notifyUserIds.delete(user.id) // Don't notify self

    for (const notifyUserId of notifyUserIds) {
      await db.notification.create({
        data: {
          userId: notifyUserId!,
          type: 'TASK_COMMENT',
          title: 'New Comment on Task',
          message: `${user.firstName} commented on: ${task.title}`,
        },
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Comment creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

### UI Components

**(Due to character limit, I'll provide abbreviated component code. Full implementations would include drag-and-drop, filtering, sorting, etc.)**

Create `src/components/tasks/TaskPanel.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { TaskStatus } from '@prisma/client'
import { TaskCard } from './TaskCard'
import { TaskCreateModal } from './TaskCreateModal'
import { Plus } from 'lucide-react'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'DONE', label: 'Done' },
]

export function TaskPanel() {
  const [tasks, setTasks] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filter, setFilter] = useState('my') // 'my' | 'assigned' | 'created' | 'all'

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    const res = await fetch(`/api/tasks?filter=${filter}`)
    const data = await res.json()
    setTasks(data.tasks)
  }

  const groupedTasks = COLUMNS.map(column => ({
    ...column,
    tasks: tasks.filter(t => t.status === column.id),
  }))

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Tasks</h2>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-purple-500/20"
          >
            <option value="my">My Tasks</option>
            <option value="assigned">Assigned to Me</option>
            <option value="created">Created by Me</option>
            <option value="all">All Tasks</option>
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {groupedTasks.map(column => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-900/50 rounded-lg border border-purple-500/20 flex flex-col"
            >
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="font-semibold text-white">{column.label}</h3>
                <p className="text-sm text-gray-400">{column.tasks.length} tasks</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {column.tasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchTasks}
      />
    </div>
  )
}
```

### Testing Checklist

**Before proceeding to Phase 3:**

- [ ] Can create tasks via UI
- [ ] Can assign tasks to employees (select from list)
- [ ] Can update task status (drag-and-drop between columns)
- [ ] Can edit task details
- [ ] Can add comments to tasks
- [ ] Can delete tasks (creator/admin only)
- [ ] Notifications sent on task assignment
- [ ] Notifications sent on task completion
- [ ] Notifications sent on new comments
- [ ] Permission checks work (only creator/assignee can edit)
- [ ] Filters work (my/assigned/created/all)
- [ ] Task panel accessible from left nav
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_TASKS` toggles feature

**Performance Checks:**
- [ ] Task list loads quickly (<500ms for 100 tasks)
- [ ] No lag when dragging tasks between columns
- [ ] Real-time updates work (polling or WebSocket)

---

## Phase 3: Shared Knowledge Base (3-4 weeks)

### Goal
Transform single-user Document model into organization-wide knowledge base with teams and permissions.

### Decision Point: Migration Strategy

**Option A: Migrate Existing Document Model**
- Pros: Preserves existing RAG documents, seamless transition
- Cons: Complex migration, potential downtime

**Option B: Create New SharedDocument Model**
- Pros: Parallel development, zero downtime, gradual migration
- Cons: Duplicate models, need to maintain both temporarily

**Recommendation:** Option B for safety. Deprecate old Document after Phase 4.

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
model Team {
  id          String @id @default(cuid())
  name        String
  description String? @db.Text

  members     TeamMembership[]
  documents   SharedDocument[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("teams")
}

model TeamMembership {
  id     String   @id @default(cuid())
  teamId String
  userId String
  role   TeamRole @default(MEMBER)

  team   Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([teamId, userId])
  @@map("team_memberships")
}

model SharedDocument {
  id          String             @id @default(cuid())
  title       String
  content     String             @db.Text
  fileType    String             // 'md' | 'txt'

  teamId      String?
  ownerId     String
  visibility  DocumentVisibility @default(PRIVATE)

  team        Team? @relation(fields: [teamId], references: [id])
  owner       User @relation("OwnedDocuments", fields: [ownerId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([teamId])
  @@index([ownerId])
  @@map("shared_documents")
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}

enum DocumentVisibility {
  PRIVATE       // Only owner can view
  TEAM          // Team members can view
  ORGANIZATION  // All employees can view
}

// Add to User model:
model User {
  // ... existing fields ...

  teamMemberships  TeamMembership[]
  ownedDocuments   SharedDocument[] @relation("OwnedDocuments")
}
```

Run migration:

```bash
npm run db:generate
npm run db:push
```

### API Routes

Create `src/app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  fileType: z.enum(['md', 'txt']).default('md'),
  visibility: z.enum(['PRIVATE', 'TEAM', 'ORGANIZATION']).default('PRIVATE'),
  teamId: z.string().optional(),
})

// GET /api/documents - List accessible documents
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        teamMemberships: {
          select: { teamId: true },
        },
      },
    })

    if (!user) return new NextResponse('User not found', { status: 404 })

    const teamIds = user.teamMemberships.map(m => m.teamId)

    // Fetch documents user can access:
    // 1. Documents they own
    // 2. TEAM documents in their teams
    // 3. ORGANIZATION documents
    const documents = await db.sharedDocument.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { visibility: 'ORGANIZATION' },
          {
            AND: [
              { visibility: 'TEAM' },
              { teamId: { in: teamIds } },
            ],
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// POST /api/documents - Create document
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const body = await req.json()
    const validated = createDocumentSchema.parse(body)

    // If visibility is TEAM, validate team membership
    if (validated.visibility === 'TEAM' && validated.teamId) {
      const membership = await db.teamMembership.findUnique({
        where: {
          teamId_userId: {
            teamId: validated.teamId,
            userId: user.id,
          },
        },
      })

      if (!membership) {
        return new NextResponse('Not a member of this team', { status: 403 })
      }
    }

    const document = await db.sharedDocument.create({
      data: {
        title: validated.title,
        content: validated.content,
        fileType: validated.fileType,
        visibility: validated.visibility,
        teamId: validated.teamId,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Document creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

Create `src/app/api/documents/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/documents/search?q=query
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        teamMemberships: {
          select: { teamId: true },
        },
      },
    })

    if (!user) return new NextResponse('User not found', { status: 404 })

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return new NextResponse('Query too short', { status: 400 })
    }

    const teamIds = user.teamMemberships.map(m => m.teamId)

    // Full-text search using PostgreSQL
    const documents = await db.sharedDocument.findMany({
      where: {
        AND: [
          {
            OR: [
              { ownerId: user.id },
              { visibility: 'ORGANIZATION' },
              {
                AND: [
                  { visibility: 'TEAM' },
                  { teamId: { in: teamIds } },
                ],
              },
            ],
          },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Document search error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

### Testing Checklist

**Before proceeding to Phase 4:**

- [ ] Can create documents with different visibility levels
- [ ] Can share documents with teams
- [ ] Can search documents by title/content
- [ ] Permission system works (owner/team/org access)
- [ ] Document browser shows accessible docs only
- [ ] Can edit owned documents
- [ ] Cannot edit other users' private documents
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_DOCS` toggles feature
- [ ] Migration from old Document model complete (if applicable)

---

## Phase 4-6: Copilot, Mentions, Transcripts, Polish

**(Abbreviated due to character limit - Full detailed steps would follow same pattern)**

### Phase 4: Copilot Panel (2-3 weeks)
- Extract chat hooks into `useCopilotChat`
- Create `CopilotPanel.tsx` persistent sidebar
- Add AI tools: `createTask`, `searchDocuments`, `findEmployee`
- Context-aware system prompts with workspace state

### Phase 5: @mentions + Transcripts (2 weeks)
- Install Tiptap with mention extension
- Add Transcript model for manual uploads
- Copilot tool: `summarizeTranscript`

### Phase 6: Polish + Performance (2-3 weeks)
- Replace polling with WebSocket/SSE
- Add pgvector for semantic search
- Jest + Playwright testing suite
- Load testing (100 concurrent users)

---

## Feature Flags & Rollout Strategy

### Gradual Enablement

```bash
# Week 1-6: Internal testing
NEXT_PUBLIC_FEATURE_WORKSPACE=true

# Week 7-10: Beta users
NEXT_PUBLIC_FEATURE_WORKSPACE=true
NEXT_PUBLIC_FEATURE_TASKS=true

# Week 11-14: All users
NEXT_PUBLIC_FEATURE_WORKSPACE=true
NEXT_PUBLIC_FEATURE_TASKS=true
NEXT_PUBLIC_FEATURE_DOCS=true

# Week 15-20: Final features
NEXT_PUBLIC_FEATURE_COPILOT=true
NEXT_PUBLIC_FEATURE_MENTIONS=true
NEXT_PUBLIC_FEATURE_TRANSCRIPTS=true
```

---

## Go/No-Go Decision Matrix

| Feature | Go? | Risk | Recommendation |
|---------|-----|------|----------------|
| Workspace Shell | ✅ YES | 🟡 Medium | Proceed with feature flag |
| Task Management | ✅ YES | 🟢 Low | Additive, safe to implement |
| Knowledge Base | ⚠️ CAUTIOUS | 🟡 Medium | Start with new SharedDocument model |
| Copilot Panel | ✅ YES | 🟢 Low | Reuse existing chat infra |
| @mention System | ✅ YES | 🟢 Low | Simple library integration |
| Meeting Transcripts | ⚠️ MANUAL ONLY | 🟡 Medium | Google Meet API unavailable, use manual upload |

**Final Recommendation:** Proceed with MVP (Phases 1-4) for 9-11 week delivery. Defer automated transcripts.

---

## Success Metrics

Track these metrics post-launch:

- Task creation rate (tasks/user/week)
- Task completion rate (%)
- Document sharing (docs shared vs. private)
- Copilot usage (messages/user/day)
- Performance (page load <2s, task actions <500ms)
- Error rate (<1% of API requests)
- User satisfaction (NPS survey)

---

## Support & Rollback Plan

### If Critical Issues Arise

1. **Immediate Rollback:** Set all feature flags to `false`
2. **Gradual Re-enable:** Turn on one feature at a time
3. **Database Rollback:** All migrations are additive, safe to leave data
4. **Communication:** Notify users via in-app banner

### Monitoring

- Set up error tracking (Sentry or similar)
- Monitor database query performance (Prisma logging)
- Track API response times (middleware logging)
- User feedback channel (in-app feedback form)

---

## Conclusion

This roadmap provides a **comprehensive, step-by-step plan** to transform OrgChart AI into a collaborative workspace platform. The phased approach ensures:

✅ **Safety:** Feature flags enable gradual rollout
✅ **Testability:** Explicit checkpoints at each phase
✅ **Backward Compatibility:** Old UI runs in parallel
✅ **Flexibility:** Can stop after MVP if needed
✅ **Scalability:** Architecture supports future expansion

**Timeline Summary:**
- **MVP (Shell + Tasks + Copilot):** 9-11 weeks
- **Full Implementation:** 16-20 weeks
- **Foundation Only:** 4-6 weeks (enables future work)

**Next Steps:**
1. Review this roadmap with stakeholders
2. Set up feature flag infrastructure
3. Begin Phase 1: Workspace Shell
4. Test rigorously at each checkpoint
5. Ship MVP, gather feedback, iterate

Good luck! 🚀
