import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Header } from '@/components/Header'
import { OrgChart } from '@/components/OrgChart'
import { ChatPanel } from '@/components/ChatPanel'
import { DashboardClient } from './DashboardClient'
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

export default async function Dashboard() {
  const currentUser = await requireAuth()
  const employees = await getEmployees()
  const adminStatus = await getAdminStatus(employees)

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <DashboardClient 
          employees={employees} 
          currentUserId={currentUser.id}
          adminStatus={adminStatus}
          currentUser={currentUser}
        />
      </main>
    </div>
  )
} 