import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/meetings - List meetings
export async function GET(req: NextRequest) {
  console.log('[/api/meetings] GET request received')

  try {
    const { userId } = await auth()
    console.log('[/api/meetings] userId:', userId)

    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    console.log('[/api/meetings] user:', user?.id)

    if (!user) return new NextResponse('User not found', { status: 404 })

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get meetings from database
    const meetings = await db.meeting.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        speakers: {
          include: {
            matchedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                title: true
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            tasks: true,
            sentences: true
          }
        }
      }
    })

    console.log(`[/api/meetings] Returning ${meetings.length} meetings`)

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('[/api/meetings] Error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
