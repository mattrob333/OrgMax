import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createChatEndedNotification, markChatAsEnded } from '@/lib/notifications'

const CHAT_TIMEOUT_MINUTES = 10

export async function POST(req: NextRequest) {
  try {
    // Find chats that are active but haven't had activity in CHAT_TIMEOUT_MINUTES
    const cutoffTime = new Date(Date.now() - CHAT_TIMEOUT_MINUTES * 60 * 1000)
    
    const inactiveChats = await db.chat.findMany({
      where: {
        isActive: true,
        lastActivityAt: {
          lt: cutoffTime
        }
      },
      include: {
        user: true,
        employee: true
      }
    })

    const results = []

    for (const chat of inactiveChats) {
      try {
        // Mark chat as ended
        await markChatAsEnded(chat.id)

        // Create notification for target employee (only if different user)
        if (chat.userId !== chat.employeeId) {
          const initiatorName = `${chat.user.firstName} ${chat.user.lastName}`.trim() || chat.user.email
          await createChatEndedNotification(chat.id, chat.employeeId, initiatorName)
        }

        results.push({
          chatId: chat.id,
          status: 'ended',
          lastActivity: chat.lastActivityAt
        })
      } catch (error) {
        console.error(`Failed to end chat ${chat.id}:`, error)
        results.push({
          chatId: chat.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return Response.json({
      message: `Processed ${inactiveChats.length} inactive chats`,
      results
    })
  } catch (error) {
    console.error('Error in chat cleanup:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}