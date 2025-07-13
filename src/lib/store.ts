import { create } from 'zustand'
import { ExtendedUser, NotificationWithChat } from '@/types'

interface AppState {
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
}

export const useAppStore = create<AppState>((set, get) => ({
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
})) 