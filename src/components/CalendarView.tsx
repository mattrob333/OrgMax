'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, Video, RefreshCw, ExternalLink } from 'lucide-react'
import { ExtendedUser } from '@/types'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  hangoutLink?: string
  location?: string
}

interface CalendarViewProps {
  user: ExtendedUser
  className?: string
}

export function CalendarView({ user, className = '' }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const REFRESH_INTERVAL = 60000 // 1 minute

  // Get events for current view
  const fetchEvents = useCallback(async (isBackgroundSync = false) => {
    if (!user.calendarConnected) {
      setError('Calendar not connected')
      return
    }

    // For background syncs, don't show main loading state
    if (isBackgroundSync) {
      setSyncing(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const startDate = new Date(currentDate)
      if (viewMode === 'week') {
        startDate.setDate(currentDate.getDate() - currentDate.getDay())
      }
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(startDate)
      if (viewMode === 'day') {
        endDate.setDate(startDate.getDate() + 1)
      } else {
        endDate.setDate(startDate.getDate() + 7)
      }

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Employee-Id': user.id,
        },
        body: JSON.stringify({
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setLastSyncTime(new Date())
    } catch (err) {
      // Only set error for initial loads, not background syncs
      if (!isBackgroundSync) {
        setError(err instanceof Error ? err.message : 'Failed to load calendar')
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [user.calendarConnected, user.id, currentDate, viewMode])

  // Initial load and dependency changes
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user.calendarConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      fetchEvents(true) // Background sync
    }, REFRESH_INTERVAL)

    // Cleanup on unmount or when auto-refresh is disabled
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefresh, user.calendarConnected, fetchEvents])

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchEvents(false)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setCurrentDate(newDate)
  }

  const formatEventTime = (event: CalendarEvent) => {
    const userTimezone = user.timezone || 'UTC'
    const startTime = new Date(event.start.dateTime).toLocaleTimeString('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const endTime = new Date(event.end.dateTime).toLocaleTimeString('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${startTime} - ${endTime}`
  }

  const formatEventDate = (event: CalendarEvent) => {
    const userTimezone = user.timezone || 'UTC'
    const eventDate = new Date(event.start.dateTime)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    // Reset times for comparison
    const eventDateOnly = new Date(eventDate.toDateString())
    const todayOnly = new Date(today.toDateString())
    const tomorrowOnly = new Date(tomorrow.toDateString())
    
    if (eventDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today'
    } else if (eventDateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Tomorrow'
    } else {
      return eventDate.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const isEventToday = (event: CalendarEvent) => {
    const userTimezone = user.timezone || 'UTC'
    const eventDate = new Date(event.start.dateTime)
    const today = new Date()
    
    const eventDateOnly = new Date(eventDate.toDateString())
    const todayOnly = new Date(today.toDateString())
    
    return eventDateOnly.getTime() === todayOnly.getTime()
  }

  const isEventUpcoming = (event: CalendarEvent) => {
    const eventDate = new Date(event.start.dateTime)
    const now = new Date()
    return eventDate > now
  }

  const formatHeaderDate = () => {
    const userTimezone = user.timezone || 'UTC'
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return `${startOfWeek.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        month: 'short',
        day: 'numeric',
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    }
  }

  if (!user.calendarConnected) {
    return (
      <div className={`bg-[#1a1a1a] border border-white/10 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-white font-medium mb-2">Calendar Not Connected</h3>
          <p className="text-gray-400 text-sm">
            Connect your Google Calendar in Settings to view events
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[#1a1a1a] border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-white font-medium flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand-accent" />
              {user.firstName}&apos;s Calendar
            </h3>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
              title="Open Google Calendar"
            >
              <span>Google Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              disabled={loading || syncing}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh calendar"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                autoRefresh 
                  ? 'bg-green-600/20 text-green-300 hover:bg-green-600/30' 
                  : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              Auto-sync
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="px-3 py-1 bg-[var(--orb-purple)]/20 text-brand-accent rounded text-sm hover:bg-brand-accent/30 transition-colors"
            >
              {viewMode === 'day' ? 'Week' : 'Day'} View
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <h4 className="text-white font-medium">
            {formatHeaderDate()}
          </h4>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {lastSyncTime && (
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>
              Last synced: {lastSyncTime.toLocaleTimeString('en-US', {
                timeZone: user.timezone || 'UTC',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
            {syncing && (
              <span className="flex items-center text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></div>
                Syncing...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchEvents(false)}
              className="mt-2 px-4 py-2 bg-[var(--orb-purple)]/20 text-brand-accent rounded text-sm hover:bg-brand-accent/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group events by date */}
            {(() => {
              const groupedEvents = events.reduce((groups, event) => {
                const dateKey = formatEventDate(event)
                if (!groups[dateKey]) {
                  groups[dateKey] = []
                }
                groups[dateKey].push(event)
                return groups
              }, {} as Record<string, CalendarEvent[]>)

              return Object.entries(groupedEvents)
                .sort(([a], [b]) => {
                  // Sort by date with Today first, then Tomorrow, then chronological
                  if (a === 'Today') return -1
                  if (b === 'Today') return 1
                  if (a === 'Tomorrow') return -1
                  if (b === 'Tomorrow') return 1
                  return a.localeCompare(b)
                })
                .map(([dateLabel, dayEvents]) => (
                  <div key={dateLabel} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center space-x-3">
                      <h4 className={`font-semibold text-sm uppercase tracking-wide ${
                        dateLabel === 'Today' ? 'text-green-400' : 
                        dateLabel === 'Tomorrow' ? 'text-blue-400' : 
                        'text-brand-accent'
                      }`}>
                        {dateLabel}
                      </h4>
                      <div className="flex-1 h-px bg-gradient-to-r from-brand-accent/30 to-transparent"></div>
                      <span className="text-xs text-gray-500">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-2 ml-4">
                      {dayEvents
                        .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
                        .map((event) => (
                        <div
                          key={event.id}
                          className={`bg-[#0f0f0f] border rounded-lg p-4 hover:border-white/10 transition-all duration-200 ${
                            isEventToday(event) && isEventUpcoming(event) 
                              ? 'border-green-500/40 bg-green-900/10' 
                              : 'border-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 mr-3">
                              <h5 className="text-white font-medium mb-1">
                                {event.summary}
                              </h5>
                              <div className="flex items-center space-x-3 text-sm">
                                <div className="flex items-center text-gray-400">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatEventTime(event)}
                                </div>
                                {isEventToday(event) && isEventUpcoming(event) && (
                                  <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs font-medium">
                                    Upcoming
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {event.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center text-gray-400">
                                  <Users className="w-4 h-4 mr-1" />
                                  {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                                </div>
                              )}
                              
                              {event.hangoutLink && (
                                <a
                                  href={event.hangoutLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                >
                                  <Video className="w-4 h-4 mr-1" />
                                  Join meeting
                                </a>
                              )}
                            </div>
                            
                            {event.location && (
                              <p className="text-gray-500 truncate max-w-32">
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            })()}
          </div>
        )}
      </div>
    </div>
  )
}