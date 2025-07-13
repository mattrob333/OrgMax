import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  customPrompt: z.string().max(500).optional(),
  timezone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { customPrompt, timezone } = updateSettingsSchema.parse(body)

    // Update user's settings
    await db.user.update({
      where: { clerkId: userId },
      data: { 
        customPrompt: customPrompt || null,
        timezone: timezone || null,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Settings update error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 