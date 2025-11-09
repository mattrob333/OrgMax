import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

// GET /api/tasks/[id] - Get single task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) return new NextResponse('Task not found', { status: 404 })

    // Permission check: only creator, assignee, or admin can view
    const canView =
      task.createdById === user.id ||
      task.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canView) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Task fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const existingTask = await db.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator, assignee, or admin can update
    const canUpdate =
      existingTask.createdById === user.id ||
      existingTask.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canUpdate) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = updateTaskSchema.parse(body)

    const task = await db.task.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        assignedToId: validated.assignedToId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    })

    // Create notification if status changed to DONE
    if (validated.status === 'DONE' && existingTask.status !== 'DONE') {
      if (existingTask.createdById !== user.id) {
        await db.notification.create({
          data: {
            userId: existingTask.createdById,
            type: 'TASK_COMPLETED',
            title: 'Task Completed',
            message: `${user.firstName} completed: ${task.title}`,
            chatId: null, // Tasks don't have associated chats
          },
        })
      }
    }

    // Create notification if reassigned
    if (
      validated.assignedToId &&
      validated.assignedToId !== existingTask.assignedToId &&
      validated.assignedToId !== user.id
    ) {
      await db.notification.create({
        data: {
          userId: validated.assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned to You',
          message: `${user.firstName} assigned you: ${task.title}`,
          chatId: null, // Tasks don't have associated chats
        },
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Task update error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id },
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator or admin can delete
    const canDelete = task.createdById === user.id || user.role === 'ADMIN'

    if (!canDelete) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task deletion error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
