import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new Response('User not found', { status: 404 })
    }

    const { notificationIds } = await req.json()

    if (!Array.isArray(notificationIds)) {
      return new Response('Invalid notification IDs', { status: 400 })
    }

    // Mark notifications as read (only user's own notifications)
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: currentUser.id
      },
      data: { isRead: true }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentUser) {
      return new Response('User not found', { status: 404 })
    }

    // Mark ALL notifications as read
    await db.notification.updateMany({
      where: {
        userId: currentUser.id,
        isRead: false
      },
      data: { isRead: true }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}