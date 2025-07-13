import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from './db'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    // Always get fresh user data from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    
    // Check if user exists in our database
    let user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        directReports: true,
        manager: true,
      },
    })

    if (!user) {
      // User doesn't exist by clerkId - try to find by email (for invited users)
      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || ''
      
      if (primaryEmail) {
        user = await db.user.findUnique({
          where: { email: primaryEmail },
          include: {
            directReports: true,
            manager: true,
          },
        })
        
        if (user) {
          // Found user by email - claim the account by updating clerkId and syncing data
          user = await db.user.update({
            where: { id: user.id },
            data: {
              clerkId: userId,
              firstName: clerkUser.firstName || user.firstName,
              lastName: clerkUser.lastName || user.lastName,
              imageUrl: clerkUser.imageUrl || user.imageUrl,
            },
            include: {
              directReports: true,
              manager: true,
            },
          })
        }
      }
      
      if (!user) {
        // User doesn't exist by clerkId OR email - create new user
        const userCount = await db.user.count()
        const isFirstUser = userCount === 0
        
        user = await db.user.create({
          data: {
            clerkId: userId,
            email: primaryEmail,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            imageUrl: clerkUser.imageUrl || '',
            role: isFirstUser ? 'ADMIN' : 'USER',
          },
          include: {
            directReports: true,
            manager: true,
          },
        })
      }
    } else {
      // User exists - sync current data from Clerk (preserve calendarConnected)
      user = await db.user.update({
        where: { clerkId: userId },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || user.email,
          firstName: clerkUser.firstName || user.firstName,
          lastName: clerkUser.lastName || user.lastName,
          imageUrl: clerkUser.imageUrl || user.imageUrl,
          // Preserve calendarConnected and other important fields
        },
        include: {
          directReports: true,
          manager: true,
        },
      })
    }

    return user
  } catch (error) {
    console.error('Error syncing user with Clerk data:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.role !== 'ADMIN') {
    redirect('/')
  }
  
  return user
} 