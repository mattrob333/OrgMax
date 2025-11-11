import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { parseActionItems } from '@/lib/fireflies/service'
import { findMentionedSpeaker } from '@/lib/fireflies/speaker-matcher'

// POST /api/meetings/[id]/tasks - Create tasks from meeting action items
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[/api/meetings/${params.id}/tasks] POST request received`)

  try {
    const { userId } = await auth()

    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })

    if (!user) return new NextResponse('User not found', { status: 404 })

    // Get the meeting with speakers
    const meeting = await db.meeting.findUnique({
      where: { id: params.id },
      include: {
        sentences: { where: { isTask: true } },
        speakers: {
          include: {
            matchedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!meeting) {
      return new NextResponse('Meeting not found', { status: 404 })
    }

    console.log(`[/api/meetings/${params.id}/tasks] Processing meeting: ${meeting.title}`)

    // Parse action items from the meeting
    const actionItems = parseActionItems(meeting.actionItems || '')

    console.log(`[/api/meetings/${params.id}/tasks] Found ${actionItems.length} action items`)

    if (actionItems.length === 0) {
      return NextResponse.json({
        message: 'No action items found in meeting',
        tasks: []
      })
    }

    const createdTasks = []

    // Create tasks for each action item
    for (const item of actionItems) {
      // Try to assign to a mentioned speaker
      const mentionedSpeaker = findMentionedSpeaker(item.text, meeting.speakers)

      const task = await db.task.create({
        data: {
          title: item.text,
          description: `Action item from meeting: ${meeting.title}\nDate: ${meeting.date.toLocaleDateString()}`,
          createdById: user.id,
          assignedToId: mentionedSpeaker?.matchedUserId || null,
          sourceMeetingId: meeting.id,
          sourceType: 'TRANSCRIPT',
          aiGenerated: true,
          priority: 'MEDIUM',
          tags: ['meeting', 'fireflies']
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true
            }
          }
        }
      })

      console.log(`[/api/meetings/${params.id}/tasks] Created task: ${task.title}`)

      createdTasks.push(task)

      // Create notification if assigned to someone
      if (task.assignedToId && task.assignedToId !== user.id) {
        await db.notification.create({
          data: {
            userId: task.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'New Task from Meeting',
            message: `${user.firstName} ${user.lastName} assigned you a task from meeting: ${meeting.title}`,
            chatId: null
          }
        })
      }
    }

    console.log(`[/api/meetings/${params.id}/tasks] Created ${createdTasks.length} tasks`)

    return NextResponse.json({
      message: `Created ${createdTasks.length} tasks from meeting`,
      tasks: createdTasks
    })
  } catch (error) {
    console.error(`[/api/meetings/${params.id}/tasks] Error:`, error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to create tasks from meeting',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
