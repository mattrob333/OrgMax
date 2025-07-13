import { auth } from "@clerk/nextjs/server"
import { db } from "./db"
import { ExtendedUser } from "@/types"

/**
 * Get the current admin user (first user who signed up)
 */
export async function getAdminUser(): Promise<ExtendedUser | null> {
  try {
    // Get the first user who signed up (admin)
    const adminUser = await db.user.findFirst({
      orderBy: {
        createdAt: 'asc'
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
        directReports: true,
        manager: true,
      }
    })
    
    return adminUser
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return null
  }
}

/**
 * Check if the current authenticated user is the admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false
    
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!currentUser) return false
    
    const adminUser = await getAdminUser()
    return adminUser?.id === currentUser.id
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if admin user exists in the org chart employee data
 */
export function isAdminInOrgChart(adminUser: ExtendedUser, employees: ExtendedUser[]): boolean {
  if (!adminUser) return false
  
  return employees.some(emp => 
    emp.email.toLowerCase() === adminUser.email.toLowerCase() ||
    emp.clerkId === adminUser.clerkId
  )
}

/**
 * Get admin user with org chart status
 */
export async function getAdminStatus(employees: ExtendedUser[]) {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    return {
      adminUser: null,
      isInOrgChart: false,
      needsFloatingNode: false
    }
  }
  
  const isInOrgChart = isAdminInOrgChart(adminUser, employees)
  
  return {
    adminUser,
    isInOrgChart,
    needsFloatingNode: !isInOrgChart
  }
} 