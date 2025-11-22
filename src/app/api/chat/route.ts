import { streamText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { clerkClient } from '@clerk/nextjs/server'
import { google } from 'googleapis'
import { getPersonalityPrompt } from '@/lib/personality-templates'
import { createChatStartedNotification, createMeetingBookedNotification, updateChatActivity } from '@/lib/notifications'

export async function POST(req: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()
  const employeeId = req.headers.get('X-Employee-Id')

  if (!employeeId) {
    return new Response('Employee ID required', { status: 400 })
  }

  // Get the current user and target employee with timezone info and documents
  const [currentUser, targetEmployee] = await Promise.all([
    db.user.findUnique({ where: { clerkId: userId } }),
    db.user.findUnique({ 
      where: { id: employeeId },
      include: { documents: true }
    }),
  ])

  if (!currentUser || !targetEmployee) {
    return new Response('User not found', { status: 404 })
  }

  // Create or get chat
  let chat = await db.chat.findUnique({
    where: {
      userId_employeeId: {
        userId: currentUser.id,
        employeeId: targetEmployee.id,
      },
    },
    include: { messages: true },
  })

  let isNewChat = false
  if (!chat) {
    chat = await db.chat.create({
      data: {
        userId: currentUser.id,
        employeeId: targetEmployee.id,
        isActive: true,
        lastActivityAt: new Date()
      },
      include: { messages: true },
    })
    isNewChat = true
    
    // Create notification for the target employee (only if they're not talking to themselves)
    if (currentUser.id !== targetEmployee.id) {
      const initiatorName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
      console.log('Creating chat started notification:', {
        chatId: chat.id,
        targetEmployeeId: targetEmployee.id,
        initiatorName,
        currentUserId: currentUser.id
      })
      try {
        await createChatStartedNotification(chat.id, targetEmployee.id, initiatorName)
        console.log('Chat started notification created successfully')
      } catch (error) {
        console.error('Failed to create chat started notification:', error)
        // Don't fail the chat creation if notification fails
      }
    } else {
      console.log('Skipping chat notification - user is talking to themselves')
    }
  } else {
    // Update activity for existing chat
    await updateChatActivity(chat.id)
  }

  // Build system prompt with current date/time in user's timezone
  const userTimezone = currentUser.timezone || 'UTC';
  const currentDateTime = new Date().toISOString();
  const currentDateFormatted = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: userTimezone
  });
  
  // Get personality template
  const personalityPrompt = getPersonalityPrompt(targetEmployee.personalityType || 'professional');
  
  // Include document content if available
  let documentContext = '';
  if (targetEmployee.documents && targetEmployee.documents.length > 0) {
    const doc = targetEmployee.documents[0]; // For now, we support one document per employee
    documentContext = `

REFERENCE DOCUMENTATION:
The following documentation provides additional context about ${targetEmployee.firstName}'s role, responsibilities, and expertise:

---
${doc.content}
---

Use this documentation to provide more accurate and detailed responses about ${targetEmployee.firstName}'s work, projects, and areas of expertise.`;
  }
  
  const systemPrompt = `You are an AI assistant representing ${targetEmployee.firstName} ${targetEmployee.lastName}, who works as a ${targetEmployee.title} in the ${targetEmployee.department} department.

PERSONALITY: ${personalityPrompt}

CURRENT DATE AND TIME: ${currentDateFormatted} (${currentDateTime})${documentContext}

You can help with:
1. General conversation about work topics
2. Checking my (${targetEmployee.firstName}'s) calendar availability
3. Scheduling meetings on my calendar (if I have connected it)
4. Answering questions about my role and responsibilities

Current conversation is with: ${currentUser.firstName} ${currentUser.lastName}

IMPORTANT: When asked about availability or scheduling, you are checking MY calendar (${targetEmployee.firstName}'s calendar), not ${currentUser.firstName}'s calendar. If I haven't connected my Google Calendar to this system, politely explain that my calendar isn't available and suggest alternative ways to schedule.

When using calendar tools, always use the current date and time above as your reference point. "Today" means ${currentDateFormatted}. All calendar events will be created in my timezone (${targetEmployee.timezone || 'UTC'}).

IMPORTANT: After using any tool, always provide a clear, helpful response to the user based on the tool's results. Never leave the user without a response.

${targetEmployee.systemMessage ? `Role-specific instructions: ${targetEmployee.systemMessage}` : ''}

${targetEmployee.customPrompt ? `Additional custom instructions: ${targetEmployee.customPrompt}` : ''}

Act as if you are speaking on behalf of ${targetEmployee.firstName}, following your personality type and any specific instructions provided.`;

  // Initialize xAI client (Grok) using OpenAI compatibility layer
  const xai = createOpenAI({
    name: 'xai',
    baseURL: 'https://api.x.ai/v1',
    apiKey: process.env.XAI_API_KEY,
  })

  try {
    console.log('Starting Chat request with XAI...')
    
    const result = await streamText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: systemPrompt,
      messages,
      maxTokens: 1024,
      temperature: 0.7,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: 'auto',
          },
        },
      },
      toolChoice: 'auto',
      maxSteps: 5,
      tools: {
        checkAvailability: tool({
          description: 'Check calendar availability for the employee',
          parameters: z.object({
            startDate: z.string().describe('Start date in ISO format'),
            endDate: z.string().describe('End date in ISO format'),
          }),
          execute: async ({ startDate, endDate }) => {
            let token: string | undefined
            try {
              // TODO: In future, offer to email target employee for their availability
              // For now, we can only check the current user's calendar
              
              // Get Google Calendar access token for the target employee (the one being asked about)
              const client = await clerkClient()
              const tokenResponse = await client.users.getUserOauthAccessToken(
                targetEmployee.clerkId,
                'google'
              )

              if (!tokenResponse || tokenResponse.data.length === 0) {
                return { 
                  error: 'calendar_not_connected',
                  message: `${targetEmployee.firstName} has not connected their calendar to this system yet. Calendar availability is not available at this time.` 
                }
              }

              token = tokenResponse.data[0].token
              const scopes = tokenResponse.data[0].scopes || []
              
              console.log('Calendar API Debug:', {
                targetEmployee: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
                email: targetEmployee.email,
                clerkId: targetEmployee.clerkId,
                hasToken: !!token,
                tokenLength: token?.length || 0,
                scopes: scopes,
                hasCalendarScope: scopes.includes('https://www.googleapis.com/auth/calendar.readonly') || scopes.includes('https://www.googleapis.com/auth/calendar.events')
              })
              
              // Initialize Google Calendar API
              const auth = new google.auth.OAuth2()
              auth.setCredentials({ access_token: token })
              const calendar = google.calendar({ version: 'v3', auth })

              // Check for free/busy information
              const freeBusyResponse = await calendar.freebusy.query({
                requestBody: {
                  timeMin: startDate,
                  timeMax: endDate,
                  items: [{ id: 'primary' }],
                },
              })

              const busyTimes = freeBusyResponse.data.calendars?.primary?.busy || []
              
              return {
                available: busyTimes.length === 0,
                busyTimes: busyTimes,
                message: busyTimes.length === 0 
                  ? `I am completely available during that time period - no conflicts found.`
                  : `I have ${busyTimes.length} conflict(s) during that time period.`,
                details: busyTimes.length === 0 
                  ? 'My calendar is completely free during this time.'
                  : `My busy periods: ${busyTimes.map(bt => `${bt.start} to ${bt.end}`).join(', ')}`
              }
            } catch (error) {
              console.error('Calendar check error:', error)
              console.error('Error details:', {
                message: error instanceof Error ? error.message : String(error),
                status: (error as any)?.status,
                code: (error as any)?.code,
                targetEmployeeId: targetEmployee.id,
                targetEmployeeEmail: targetEmployee.email,
                targetEmployeeClerkId: targetEmployee.clerkId,
                hasToken: !!token
              })
              return { error: 'Unable to check calendar at this time: ' + (error instanceof Error ? error.message : 'Unknown error') }
            }
          },
        }),
        bookMeeting: tool({
          description: 'Book a meeting on the employees calendar',
          parameters: z.object({
            title: z.string().describe('Meeting title'),
            startTime: z.string().describe('Meeting start time in ISO format'),
            endTime: z.string().describe('Meeting end time in ISO format'),
            description: z.string().optional().describe('Meeting description'),
            attendeeEmails: z.array(z.string()).optional().describe('Additional attendee emails'),
          }),
          execute: async ({ title, startTime, endTime, description, attendeeEmails = [] }) => {
            try {
              // TODO: In future, allow booking meetings with email invites to non-connected users
              // For now, we can only book on the target employee's calendar (the one being asked)
              
              // Get Google Calendar access token for the target employee
              const client = await clerkClient()
              const tokenResponse = await client.users.getUserOauthAccessToken(
                targetEmployee.clerkId,
                'google'
              )

              if (!tokenResponse || tokenResponse.data.length === 0) {
                return { 
                  error: 'calendar_not_connected',
                  message: `I haven't connected my calendar to this system yet, so I can't book meetings directly. Please reach out to me via email or other means to schedule.` 
                }
              }

              const token = tokenResponse.data[0].token

              // Initialize Google Calendar API
              const auth = new google.auth.OAuth2()
              auth.setCredentials({ access_token: token })
              const calendar = google.calendar({ version: 'v3', auth })

              // Include both the current user and target employee as attendees
              const attendees = [
                { email: currentUser.email },
                { email: targetEmployee.email },
                ...attendeeEmails.map(email => ({ email }))
              ]

              // Get target employee's timezone for the event
              const eventTimezone = targetEmployee.timezone || 'UTC';
              
              // Create the event
              const event = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                  summary: title,
                  description: description || `Meeting scheduled via OrgChart AI`,
                  start: {
                    dateTime: startTime,
                    timeZone: eventTimezone,
                  },
                  end: {
                    dateTime: endTime,
                    timeZone: eventTimezone,
                  },
                  attendees: attendees,
                  conferenceData: {
                    createRequest: {
                      requestId: `${Date.now()}`,
                      conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                  },
                },
                conferenceDataVersion: 1,
              })

              // Create meeting booked notification for target employee (only if different user)
              if (currentUser.id !== targetEmployee.id) {
                const initiatorName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
                console.log('Creating meeting booked notification:', {
                  chatId: chat.id,
                  targetEmployeeId: targetEmployee.id,
                  initiatorName,
                  meetingTitle: title,
                  currentUserId: currentUser.id
                })
                try {
                  await createMeetingBookedNotification(chat.id, targetEmployee.id, initiatorName, title)
                  console.log('Meeting booked notification created successfully')
                } catch (error) {
                  console.error('Failed to create meeting booked notification:', error)
                  // Don't fail the meeting booking if notification fails
                }
              } else {
                console.log('Skipping meeting notification - user is booking with themselves')
              }

              return {
                success: true,
                eventId: event.data.id,
                meetingLink: event.data.hangoutLink,
                message: `Meeting "${title}" has been scheduled successfully!`,
              }
            } catch (error) {
              console.error('Meeting booking error:', error)
              return { error: 'Unable to book meeting at this time' }
            }
          },
        }),
      },
      onFinish: async ({ usage, finishReason, text }) => {
        // Save the user message and AI response to database
        if (text && text.trim()) {
          await db.message.createMany({
            data: [
              {
                chatId: chat.id,
                userId: currentUser.id,
                role: 'user',
                content: messages[messages.length - 1]?.content || '',
              },
              {
                chatId: chat.id,
                userId: currentUser.id,
                role: 'assistant',
                content: text,
              },
            ],
          })
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 