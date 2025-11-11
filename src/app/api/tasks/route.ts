import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
})

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  console.log('[/api/tasks] GET request received')
  try {
    const { userId } = await auth()
    console.log('[/api/tasks] userId:', userId)
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    console.log('[/api/tasks] user:', user?.id)
    if (!user) return new NextResponse('User not found', { status: 404 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') // 'my' | 'assigned' | 'created' | 'all'
    const status = searchParams.get('status') // 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

    let where: any = {}

    if (filter === 'assigned') {
      where.assignedToId = user.id
    } else if (filter === 'created') {
      where.createdById = user.id
    } else if (filter === 'my') {
      where.OR = [
        { assignedToId: user.id },
        { createdById: user.id },
      ]
    }

    if (status) {
      where.status = status
    }

    const tasks = await db.task.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('[/api/tasks] Error:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/tasks - Create task
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const body = await req.json()
    const validated = createTaskSchema.parse(body)

    const task = await db.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        createdById: user.id,
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

    // Create notification if assigned to someone
    if (task.assignedToId && task.assignedToId !== user.id) {
      await db.notification.create({
        data: {
          userId: task.assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `${user.firstName} ${user.lastName} assigned you: ${task.title}`,
          chatId: null, // Tasks don't have associated chats
        },
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Task creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
