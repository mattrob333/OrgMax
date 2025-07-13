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

    // Get chat with messages and verify access
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
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

    // Security: Verify the current user is involved in this chat
    // Either they initiated the chat OR they are the employee (agent) being chatted with
    if (chat.userId !== currentUser.id && chat.employeeId !== currentUser.id) {
      return new Response('Forbidden - you can only view chats you initiated or chats with your agent', { status: 403 })
    }

    return Response.json({
      id: chat.id,
      messages: chat.messages,
      user: chat.user,
      employee: chat.employee,
      isActive: chat.isActive,
      lastActivityAt: chat.lastActivityAt,
      endedAt: chat.endedAt,
      createdAt: chat.createdAt
    })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}