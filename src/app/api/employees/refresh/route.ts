import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getAdminStatus } from '@/lib/admin'

async function getEmployees() {
  return await db.user.findMany({
    where: {
      employeeId: { not: null }
    },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      role: true,
      customPrompt: true,
      personalityType: true,
      systemMessage: true,
      calendarConnected: true,
      timezone: true,
      employeeId: true,
      title: true,
      department: true,
      managerId: true,
      isExplicitRoot: true,
      createdAt: true,
      updatedAt: true,
      directReports: {
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          customPrompt: true,
          personalityType: true,
          systemMessage: true,
          calendarConnected: true,
          timezone: true,
          employeeId: true,
          title: true,
          department: true,
          managerId: true,
          isExplicitRoot: true,
          createdAt: true,
          updatedAt: true,
        }
      },
      manager: {
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          customPrompt: true,
          personalityType: true,
          systemMessage: true,
          calendarConnected: true,
          timezone: true,
          employeeId: true,
          title: true,
          department: true,
          managerId: true,
          isExplicitRoot: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
    orderBy: {
      firstName: 'asc',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get fresh employee data
    const employees = await getEmployees()
    const adminStatus = await getAdminStatus(employees)

    return NextResponse.json({ 
      employees,
      adminStatus
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Refresh employees error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}