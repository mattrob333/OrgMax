import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { google } from 'googleapis'
import { db } from '@/lib/db'
import { z } from 'zod'

const eventsRequestSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  maxResults: z.number().optional().default(50),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const employeeId = req.headers.get('X-Employee-Id')
    if (!employeeId) {
      return new NextResponse('Employee ID required', { status: 400 })
    }

    const body = await req.json()
    const { timeMin, timeMax, maxResults } = eventsRequestSchema.parse(body)

    // Get the target employee (whose calendar we're viewing)
    const targetEmployee = await db.user.findUnique({
      where: { id: employeeId }
    })

    if (!targetEmployee) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    // Check if the current user has permission to view this calendar
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // For now, only allow users to view their own calendar
    // In the future, you could add logic for managers to view their reports' calendars
    if (currentUser.id !== targetEmployee.id && currentUser.role !== 'ADMIN') {
      return new NextResponse('Permission denied', { status: 403 })
    }

    if (!targetEmployee.calendarConnected) {
      return NextResponse.json({
        error: 'calendar_not_connected',
        message: 'Calendar not connected for this user'
      })
    }

    // Get Google Calendar access token
    const client = await clerkClient()
    const tokenResponse = await client.users.getUserOauthAccessToken(
      targetEmployee.clerkId,
      'google'
    )

    if (!tokenResponse || tokenResponse.data.length === 0) {
      return NextResponse.json({
        error: 'no_token',
        message: 'No valid Google token found'
      })
    }

    const token = tokenResponse.data[0].token
    const scopes = tokenResponse.data[0].scopes || []

    // Check if we have calendar permissions
    const hasCalendarAccess = scopes.includes('https://www.googleapis.com/auth/calendar.readonly') || 
                              scopes.includes('https://www.googleapis.com/auth/calendar.events')

    if (!hasCalendarAccess) {
      return NextResponse.json({
        error: 'insufficient_permissions',
        message: 'Calendar permissions not granted'
      })
    }

    // Initialize Google Calendar API
    const googleAuth = new google.auth.OAuth2()
    googleAuth.setCredentials({ access_token: token })
    const calendar = google.calendar({ version: 'v3', auth: googleAuth })

    // Fetch calendar events
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = eventsResponse.data.items || []

    // Transform events to match our interface
    const transformedEvents = events
      .filter(event => event.start?.dateTime && event.end?.dateTime) // Only include events with specific times
      .map(event => ({
        id: event.id || '',
        summary: event.summary || 'Untitled Event',
        description: event.description || '',
        start: {
          dateTime: event.start!.dateTime!,
          timeZone: event.start!.timeZone || targetEmployee.timezone || 'UTC',
        },
        end: {
          dateTime: event.end!.dateTime!,
          timeZone: event.end!.timeZone || targetEmployee.timezone || 'UTC',
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName || attendee.email || '',
        })) || [],
        hangoutLink: event.hangoutLink || '',
        location: event.location || '',
      }))

    return NextResponse.json({
      events: transformedEvents,
      timeRange: { timeMin, timeMax },
      timezone: targetEmployee.timezone || 'UTC',
    })

  } catch (error) {
    console.error('Calendar events fetch error:', error)
    
    // Handle specific Google API errors
    if ((error as any)?.code === 401) {
      return NextResponse.json({
        error: 'token_expired',
        message: 'Calendar access token expired. Please reconnect your calendar.'
      }, { status: 401 })
    }

    if ((error as any)?.code === 403) {
      return NextResponse.json({
        error: 'permission_denied',
        message: 'Insufficient permissions to access calendar'
      }, { status: 403 })
    }

    return new NextResponse('Internal server error', { status: 500 })
  }
}