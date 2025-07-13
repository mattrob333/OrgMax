import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { PersonalityType } from '@prisma/client'

const updateEmployeeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  title: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  customPrompt: z.string().max(500).optional(),
  personalityType: z.nativeEnum(PersonalityType).optional(),
  systemMessage: z.string().max(1000).optional(),
  timezone: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: currentUserId } = await auth()
    
    if (!currentUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify the current user is an admin
    const currentUser = await db.user.findUnique({
      where: { clerkId: currentUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return new NextResponse('Forbidden - Admin access required', { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateEmployeeSchema.parse(body)

    // Check if the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, email: true }
    })

    if (!targetUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Prepare update data - only include fields that were provided
    const updateData: Record<string, any> = {}
    
    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName
    if (validatedData.title !== undefined) updateData.title = validatedData.title || null
    if (validatedData.department !== undefined) updateData.department = validatedData.department || null
    if (validatedData.customPrompt !== undefined) updateData.customPrompt = validatedData.customPrompt || null
    if (validatedData.personalityType !== undefined) updateData.personalityType = validatedData.personalityType
    if (validatedData.systemMessage !== undefined) updateData.systemMessage = validatedData.systemMessage || null
    if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone || null

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: validatedData.userId },
      data: updateData,
      include: {
        manager: true,
        directReports: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        title: updatedUser.title,
        department: updatedUser.department,
        customPrompt: updatedUser.customPrompt,
        personalityType: updatedUser.personalityType,
        systemMessage: updatedUser.systemMessage,
        timezone: updatedUser.timezone,
        role: updatedUser.role,
        calendarConnected: updatedUser.calendarConnected,
        imageUrl: updatedUser.imageUrl,
        manager: updatedUser.manager,
        directReports: updatedUser.directReports,
      }
    })

  } catch (error) {
    console.error('Employee update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error', 
          details: error.errors 
        }, 
        { status: 400 }
      )
    }

    return new NextResponse('Internal server error', { status: 500 })
  }
}