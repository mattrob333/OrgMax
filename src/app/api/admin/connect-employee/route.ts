import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const connectSchema = z.object({
  employeeId: z.string().min(1),
  managerId: z.string().nullable(), // null for unknown status, 'ROOT' for explicit root
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { employeeId, managerId } = connectSchema.parse(body)

    // Validate that the employee exists
    const employee = await db.user.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    let finalManagerId: string | null = null
    let isExplicitRoot = false

    if (managerId === 'ROOT') {
      // Special case: making this an explicit root node
      finalManagerId = null
      isExplicitRoot = true
    } else if (managerId) {
      // Regular manager assignment
      const manager = await db.user.findUnique({
        where: { id: managerId },
      })

      if (!manager) {
        return new NextResponse('Manager not found', { status: 404 })
      }

      // Prevent circular relationships
      if (managerId === employeeId) {
        return new NextResponse('Employee cannot be their own manager', { status: 400 })
      }

      // Check if this would create a circular hierarchy
      const wouldCreateCycle = await checkForCircularHierarchy(employeeId, managerId)
      if (wouldCreateCycle) {
        return new NextResponse('This connection would create a circular hierarchy', { status: 400 })
      }

      finalManagerId = managerId
      isExplicitRoot = false
    } else {
      // null managerId means unknown status (not explicit root)
      finalManagerId = null
      isExplicitRoot = false
    }

    // Update the employee's manager and root status
    await db.user.update({
      where: { id: employeeId },
      data: { 
        managerId: finalManagerId,
        isExplicitRoot
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: managerId === 'ROOT'
        ? 'Employee set as explicit root node successfully'
        : managerId 
          ? 'Employee connected to manager successfully' 
          : 'Employee disconnected from manager successfully'
    })

  } catch (error) {
    console.error('Connect employee error:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
}

/**
 * Check if connecting an employee to a manager would create a circular hierarchy
 */
async function checkForCircularHierarchy(employeeId: string, managerId: string): Promise<boolean> {
  // Get all employees with their manager relationships
  const allUsers = await db.user.findMany({
    select: { id: true, managerId: true }
  })

  // Create a map of user -> manager relationships
  const managerMap = new Map<string, string | null>()
  allUsers.forEach(user => {
    managerMap.set(user.id, user.managerId)
  })

  // Temporarily set the new relationship to check for cycles
  managerMap.set(employeeId, managerId)

  // Traverse up from the manager to see if we reach the employee
  let currentId: string | null = managerId
  const visited = new Set<string>()

  while (currentId) {
    if (visited.has(currentId)) {
      // We found a cycle
      return true
    }
    
    if (currentId === employeeId) {
      // The manager chain leads back to the employee - this would create a cycle
      return true
    }

    visited.add(currentId)
    currentId = managerMap.get(currentId) || null
  }

  return false
}