import { User, Chat, Message, Role, MessageRole, PersonalityType, Notification, NotificationType } from '@prisma/client'

export type { User, Chat, Message, Role, MessageRole, PersonalityType, Notification, NotificationType }

export interface ExtendedUser extends User {
  manager?: ExtendedUser | null
  directReports?: ExtendedUser[]
  isAdmin?: boolean // Added for admin detection
}

export interface ChatWithMessages extends Chat {
  messages: Message[]
  user: User
  employee: User
}

export interface NotificationWithChat extends Notification {
  chat: {
    user: Pick<User, 'firstName' | 'lastName' | 'imageUrl'>
  }
}

export interface NodeData {
  user: ExtendedUser
  isAdmin?: boolean // Added for admin styling
  isFloatingAdmin?: boolean // Added for floating admin nodes
  isUnconnected?: boolean // Added for unconnected node detection
  currentUserIsAdmin?: boolean
  currentUserId?: string
  hasChatHistory?: boolean // Added for chat history feature
  onCalendarClick?: (user: ExtendedUser) => void
  onConnectClick?: (user: ExtendedUser) => void // Added for connecting nodes
  onEditClick?: (user: ExtendedUser) => void // Added for editing node details (admin-only)
  onChatHistoryClick?: (user: ExtendedUser) => void // Added for chat history access
  onRefresh?: () => Promise<void> // Added for refreshing data after changes
}

export interface EmployeeCSVRow {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  title: string
  department: string
  managerId?: string
  personalityType?: PersonalityType
  systemMessage?: string
} 