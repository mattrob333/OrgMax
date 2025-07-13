import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { markChatAsEnded, createChatEndedNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { chatId, employeeId } = await req.json()

    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new Response('User not found', { status: 404 })
    }

    let chat;
    
    if (chatId) {
      // Find by chatId
      chat = await db.chat.findUnique({
        where: { id: chatId },
        include: {
          user: true,
          employee: true
        }
      })
    } else if (employeeId) {
      // Find by user-employee relationship
      chat = await db.chat.findUnique({
        where: {
          userId_employeeId: {
            userId: currentUser.id,
            employeeId: employeeId
          }
        },
        include: {
          user: true,
          employee: true
        }
      })
    } else {
      return new Response('Chat ID or Employee ID required', { status: 400 })
    }

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // Only the chat initiator can end the chat
    if (chat.userId !== currentUser.id) {
      return new Response('Forbidden', { status: 403 })
    }

    // Mark chat as ended
    await markChatAsEnded(chat.id)

    // Create notification for target employee (only if different user)
    if (currentUser.id !== chat.employeeId) {
      const initiatorName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
      try {
        await createChatEndedNotification(chat.id, chat.employeeId, initiatorName)
      } catch (error) {
        console.error('Failed to create chat ended notification:', error)
        // Don't fail the chat ending if notification fails
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error ending chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}