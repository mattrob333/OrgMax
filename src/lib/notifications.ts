import { db } from './db'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string // The user who should receive the notification
  chatId: string
  type: NotificationType
  title: string
  message: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        chatId: params.chatId,
        type: params.type,
        title: params.title,
        message: params.message
      }
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function createChatStartedNotification(chatId: string, targetEmployeeId: string, initiatorName: string) {
  await createNotification({
    userId: targetEmployeeId,
    chatId,
    type: 'CHAT_STARTED',
    title: 'New Chat Started',
    message: `${initiatorName} started a conversation with your AI assistant`
  })
}

export async function createChatEndedNotification(chatId: string, targetEmployeeId: string, initiatorName: string) {
  await createNotification({
    userId: targetEmployeeId,
    chatId,
    type: 'CHAT_ENDED',
    title: 'Chat Ended',
    message: `Conversation with ${initiatorName} has ended`
  })
}

export async function createMeetingBookedNotification(chatId: string, targetEmployeeId: string, initiatorName: string, meetingTitle: string) {
  await createNotification({
    userId: targetEmployeeId,
    chatId,
    type: 'MEETING_BOOKED',
    title: 'Meeting Booked',
    message: `${initiatorName} booked a meeting: "${meetingTitle}"`
  })
}

export async function markChatAsEnded(chatId: string) {
  try {
    await db.chat.update({
      where: { id: chatId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error marking chat as ended:', error)
    throw error
  }
}

export async function updateChatActivity(chatId: string) {
  try {
    await db.chat.update({
      where: { id: chatId },
      data: { lastActivityAt: new Date() }
    })
  } catch (error) {
    console.error('Error updating chat activity:', error)
    throw error
  }
}