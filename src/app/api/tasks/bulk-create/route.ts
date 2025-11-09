import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bulkTaskSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    assignedToEmail: z.string().email().optional(), // Email from @mention
    tags: z.array(z.string()).optional(),
  })),
  sourceDocumentId: z.string().optional(),
  sourceType: z.enum(['MANUAL', 'COPILOT', 'TRANSCRIPT', 'DOCUMENT']).default('COPILOT'),
})

// POST /api/tasks/bulk-create - Create multiple tasks at once
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const body = await req.json()
    const validated = bulkTaskSchema.parse(body)

    // Limit to 25 tasks per bulk create
    if (validated.tasks.length > 25) {
      return new NextResponse('Maximum 25 tasks per bulk create', { status: 400 })
    }

    const created: any[] = []
    const failed: any[] = []

    // Process tasks sequentially to avoid race conditions
    for (const taskData of validated.tasks) {
      try {
        // Find assignee by email if provided
        let assignedToId: string | undefined

        if (taskData.assignedToEmail) {
          const assignee = await db.user.findUnique({
            where: { email: taskData.assignedToEmail }
          })
          if (assignee) {
            assignedToId = assignee.id
          }
        }

        // Create task
        const task = await db.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            createdById: user.id,
            assignedToId,
            sourceType: validated.sourceType,
            sourceDocumentId: validated.sourceDocumentId,
            aiGenerated: true,
            tags: taskData.tags || [],
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        })

        // Create notification if assigned
        if (assignedToId && assignedToId !== user.id) {
          await db.notification.create({
            data: {
              userId: assignedToId,
              type: validated.sourceType === 'TRANSCRIPT' || validated.sourceType === 'DOCUMENT'
                ? 'TASK_FROM_DOCUMENT'
                : 'TASK_ASSIGNED',
              title: 'New Task Assigned',
              message: `${user.firstName} ${user.lastName} assigned you: ${task.title}`,
              chatId: null,
            },
          })
        }

        // Link to source document if provided
        if (validated.sourceDocumentId) {
          await db.taskDocument.create({
            data: {
              taskId: task.id,
              documentId: validated.sourceDocumentId,
              linkType: 'SOURCE',
            },
          })
        }

        created.push(task)
      } catch (error) {
        console.error('Failed to create task:', taskData.title, error)
        failed.push({
          task: taskData,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      failed: failed.length,
      tasks: created,
      errors: failed,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Bulk task creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
