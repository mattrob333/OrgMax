import { create } from 'zustand'
import { ExtendedUser, NotificationWithChat } from '@/types'

interface WorkspaceLayout {
  leftSidebarWidth: number
  rightPanelWidth: number
  leftSidebarCollapsed: boolean
  rightPanelCollapsed: boolean
  activeTab: 'orgchart' | 'tasks' | 'files' | 'calendar'
}

interface CopilotTask {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
}

interface CopilotDocument {
  id: string
  fileName: string
  content: string
}

interface AppState {
  // Copilot state
  copilotActiveTask: CopilotTask | null
  setCopilotActiveTask: (task: CopilotTask | null) => void
  copilotAttachedDocuments: CopilotDocument[]
  addCopilotDocument: (doc: CopilotDocument) => void
  removeCopilotDocument: (docId: string) => void
  clearCopilotContext: () => void
  // Chat state
  activeChatUserId: string | null
  setActiveChatUserId: (userId: string | null) => void
  
  // Org chart state
  employees: ExtendedUser[]
  setEmployees: (employees: ExtendedUser[]) => void
  
  // Notification state
  notifications: NotificationWithChat[]
  setNotifications: (notifications: NotificationWithChat[]) => void
  unreadCount: number
  setUnreadCount: (count: number) => void
  isNotificationPanelOpen: boolean
  setIsNotificationPanelOpen: (isOpen: boolean) => void
  
  // Chat history state
  chatHistoryId: string | null
  setChatHistoryId: (chatId: string | null) => void
  isChatHistoryModalOpen: boolean
  setIsChatHistoryModalOpen: (isOpen: boolean) => void
  
  // UI state
  isChatPanelOpen: boolean
  setIsChatPanelOpen: (isOpen: boolean) => void

  // Workspace state
  workspaceLayout: WorkspaceLayout
  setWorkspaceLayout: (layout: Partial<WorkspaceLayout>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Copilot state
  copilotActiveTask: null,
  setCopilotActiveTask: (task) => set({ copilotActiveTask: task }),
  copilotAttachedDocuments: [],
  addCopilotDocument: (doc) => set((state) => ({
    copilotAttachedDocuments: [...state.copilotAttachedDocuments, doc]
  })),
  removeCopilotDocument: (docId) => set((state) => ({
    copilotAttachedDocuments: state.copilotAttachedDocuments.filter(d => d.id !== docId)
  })),
  clearCopilotContext: () => set({
    copilotActiveTask: null,
    copilotAttachedDocuments: []
  }),

  // Chat state
  activeChatUserId: null,
  setActiveChatUserId: (userId) => set({
    activeChatUserId: userId,
    isChatPanelOpen: !!userId
  }),
  
  // Org chart state
  employees: [],
  setEmployees: (employees) => set({ employees }),
  
  // Notification state
  notifications: [],
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.isRead).length
    set({ notifications, unreadCount })
  },
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  isNotificationPanelOpen: false,
  setIsNotificationPanelOpen: (isOpen) => set({ isNotificationPanelOpen: isOpen }),
  
  // Chat history state
  chatHistoryId: null,
  setChatHistoryId: (chatId) => set({ chatHistoryId: chatId }),
  isChatHistoryModalOpen: false,
  setIsChatHistoryModalOpen: (isOpen) => set({ 
    isChatHistoryModalOpen: isOpen,
    // Close notification panel when opening chat history
    isNotificationPanelOpen: isOpen ? false : get().isNotificationPanelOpen
  }),
  
  // UI state
  isChatPanelOpen: false,
  setIsChatPanelOpen: (isOpen) => set({ isChatPanelOpen: isOpen }),

  // Workspace state
  workspaceLayout: {
    leftSidebarWidth: 220,
    rightPanelWidth: 400,
    leftSidebarCollapsed: false,
    rightPanelCollapsed: false, // Show Copilot panel by default
    activeTab: 'orgchart',
  },
  setWorkspaceLayout: (layout) =>
    set((state) => ({
      workspaceLayout: { ...state.workspaceLayout, ...layout },
    })),
})) 