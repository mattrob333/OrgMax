import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

// POST /api/tasks/[id]/comments - Add comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const task = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Permission check: only creator, assignee, or admin can comment
    const canComment =
      task.createdById === user.id ||
      task.assignedToId === user.id ||
      user.role === 'ADMIN'

    if (!canComment) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = createCommentSchema.parse(body)

    const comment = await db.taskComment.create({
      data: {
        taskId: params.id,
        userId: user.id,
        content: validated.content,
      },
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
    })

    // Notify task creator and assignee (if not the commenter)
    const notifyUserIds = new Set([task.createdById, task.assignedToId].filter(Boolean))
    notifyUserIds.delete(user.id) // Don't notify self

    for (const notifyUserId of Array.from(notifyUserIds)) {
      await db.notification.create({
        data: {
          userId: notifyUserId!,
          type: 'TASK_COMMENT',
          title: 'New Comment on Task',
          message: `${user.firstName} commented on: ${task.title}`,
          chatId: null, // Tasks don't have associated chats
        },
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Comment creation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
