import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userIdToDelete = searchParams.get('userId')

    if (!userIdToDelete) {
      return new NextResponse('User ID required', { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userIdToDelete === currentUser.id) {
      return new NextResponse('Cannot delete your own account', { status: 400 })
    }

    // Find the user to delete
    const userToDelete = await db.user.findUnique({
      where: { id: userIdToDelete },
      include: {
        directReports: true,
        manager: true,
      },
    })

    if (!userToDelete) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Update any direct reports to remove this user as manager
    await db.user.updateMany({
      where: { managerId: userIdToDelete },
      data: { managerId: null },
    })

    // Delete related chat data first to avoid foreign key constraints
    // Delete all chats where user is either the user or the employee
    await db.chat.deleteMany({
      where: {
        OR: [
          { userId: userIdToDelete },
          { employeeId: userIdToDelete }
        ]
      }
    })

    // Delete any remaining messages by this user (should be cascaded by chat deletion but being safe)
    await db.message.deleteMany({
      where: { userId: userIdToDelete }
    })

    // Now safely delete the user from database
    await db.user.delete({
      where: { id: userIdToDelete },
    })

    // Also delete from Clerk if the user exists there
    let clerkDeletionResult = null
    if (userToDelete.clerkId && !userToDelete.clerkId.startsWith('temp_')) {
      try {
        const client = await clerkClient()
        await client.users.deleteUser(userToDelete.clerkId)
        clerkDeletionResult = 'User also deleted from Clerk authentication system'
        console.log(`Successfully deleted user ${userToDelete.email} from both database and Clerk`)
      } catch (clerkError) {
        // Don't fail the entire operation if Clerk deletion fails
        // The user might not exist in Clerk or might already be deleted
        console.warn(`Failed to delete user ${userToDelete.email} from Clerk:`, clerkError)
        clerkDeletionResult = 'User deleted from database, but Clerk deletion failed (user may not exist in Clerk)'
      }
    } else {
      clerkDeletionResult = 'User only existed in database (no Clerk account to delete)'
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${userToDelete.firstName} ${userToDelete.lastName} deleted successfully`,
      clerkStatus: clerkDeletionResult
    })

  } catch (error) {
    console.error('User deletion error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}