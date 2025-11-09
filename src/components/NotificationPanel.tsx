'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MessageCircle, Calendar, X, Bell } from 'lucide-react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'
import { NotificationWithChat } from '@/types'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'CHAT_STARTED':
    case 'CHAT_ENDED':
      return MessageCircle
    case 'MEETING_BOOKED':
    case 'CALENDAR_UPDATED':
      return Calendar
    default:
      return MessageCircle
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'CHAT_STARTED':
      return 'text-green-400'
    case 'CHAT_ENDED':
      return 'text-gray-400'
    case 'MEETING_BOOKED':
      return 'text-blue-400'
    case 'CALENDAR_UPDATED':
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface NotificationItemProps {
  notification: NotificationWithChat
  onMarkRead: (id: string) => void
  onChatOpen: (userId: string) => void
}

const NotificationItem = ({ notification, onMarkRead, onChatOpen }: NotificationItemProps) => {
  const Icon = getNotificationIcon(notification.type)
  const iconColor = getNotificationColor(notification.type)
  const userName = `${notification.chat.user.firstName} ${notification.chat.user.lastName}`.trim()
  const initials = getInitials(notification.chat.user.firstName || undefined, notification.chat.user.lastName || undefined)

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
    // Open chat with the user who triggered the notification
    if (notification.chatId) {
      onChatOpen(notification.chatId)
    }
  }

  return (
    <div 
      className={`p-4 border-b border-gray-700/50 hover:bg-gray-800/50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-purple-900/10 border-l-4 border-l-purple-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            {notification.chat.user.imageUrl ? (
              <Image
                src={notification.chat.user.imageUrl}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white font-medium text-sm">
                {initials}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">{notification.title}</h4>
              <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkRead(notification.id)
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatTimeAgo(new Date(notification.createdAt))}
          </p>
        </div>
      </div>
    </div>
  )
}

export function NotificationPanel() {
  const { 
    notifications, 
    isNotificationPanelOpen, 
    setIsNotificationPanelOpen,
    setNotifications,
    setChatHistoryId,
    setIsChatHistoryModalOpen
  } = useAppStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false)
      }
    }

    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationPanelOpen, setIsNotificationPanelOpen])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })

      if (response.ok) {
        // Update local state
        const updatedNotifications = notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
        setNotifications(updatedNotifications)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT'
      })

      if (response.ok) {
        // Update local state
        const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }))
        setNotifications(updatedNotifications)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const openChatFromNotification = async (chatId: string) => {
    // Open the chat history modal for this specific chat
    setChatHistoryId(chatId)
    setIsChatHistoryModalOpen(true)
  }

  return (
    <AnimatePresence>
      {isNotificationPanelOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-14 right-0 w-96 bg-gray-900 border border-gray-700/50 rounded-lg shadow-2xl shadow-purple-900/10 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsNotificationPanelOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">You&apos;ll see notifications when people chat with your AI assistant</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onChatOpen={openChatFromNotification}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}