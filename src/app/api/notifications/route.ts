import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
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

    const notifications = await db.notification.findMany({
      where: { userId: currentUser.id },
      include: {
        chat: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 notifications
    })

    return Response.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}