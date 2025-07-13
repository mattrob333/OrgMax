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

    // Get all chats where the current user is the initiator
    // This returns employee IDs that the user has chatted with
    const userChats = await db.chat.findMany({
      where: { userId: currentUser.id },
      select: {
        employeeId: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      distinct: ['employeeId']
    })

    // Extract unique employee IDs and basic info
    const chattedEmployees = userChats.map(chat => ({
      employeeId: chat.employeeId,
      employeeName: `${chat.employee.firstName} ${chat.employee.lastName}`.trim()
    }))

    return Response.json({
      chattedEmployees,
      count: chattedEmployees.length
    })
  } catch (error) {
    console.error('Error fetching chat availability:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}