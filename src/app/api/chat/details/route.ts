import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const chatId = url.searchParams.get('chatId')

    if (!chatId) {
      return new Response('Chat ID required', { status: 400 })
    }

    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new Response('User not found', { status: 404 })
    }

    // Get chat details with user info
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            email: true
          }
        }
      }
    })

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // Verify the current user is involved in this chat
    if (chat.userId !== currentUser.id && chat.employeeId !== currentUser.id) {
      return new Response('Forbidden', { status: 403 })
    }

    return Response.json({
      id: chat.id,
      userId: chat.userId,
      employeeId: chat.employeeId,
      user: chat.user,
      employee: chat.employee,
      isActive: chat.isActive,
      lastActivityAt: chat.lastActivityAt,
      endedAt: chat.endedAt
    })
  } catch (error) {
    console.error('Error fetching chat details:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { employeeId } = body

    if (!employeeId) {
      return new Response('Employee ID required', { status: 400 })
    }

    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new Response('User not found', { status: 404 })
    }

    // Find the most recent chat between current user and the specified employee
    const chat = await db.chat.findFirst({
      where: {
        userId: currentUser.id,
        employeeId: employeeId
      },
      orderBy: {
        lastActivityAt: 'desc'
      },
      select: {
        id: true
      }
    })

    if (!chat) {
      return Response.json({ chatId: null })
    }

    return Response.json({ chatId: chat.id })
  } catch (error) {
    console.error('Error finding chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}