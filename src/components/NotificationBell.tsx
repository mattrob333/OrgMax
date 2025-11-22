'use client'

import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { NotificationWithChat } from '@/types'
import { useAuth } from '@clerk/nextjs'

export function NotificationBell() {
  const {
    unreadCount,
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,
    setNotifications
  } = useAppStore()

  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    // Don't fetch if auth isn't loaded or user isn't signed in
    if (!isLoaded || !isSignedIn) {
      return
    }

    // Fetch notifications on component mount
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications)
        } else if (response.status !== 401) {
          // Only log non-401 errors (401 is expected when not authenticated)
          console.error('Failed to fetch notifications: HTTP', response.status)
        }
      } catch (error) {
        // Handle network errors or parsing errors
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [setNotifications, isLoaded, isSignedIn])

  return (
    <button
      onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
      className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      title="Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}