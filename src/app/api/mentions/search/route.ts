import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/mentions/search?q=searchTerm&context=task
// Returns users for @mention autocomplete
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const context = searchParams.get('context') || 'task' // task, chat, comment

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] })
    }

    // Search users by firstName, lastName, title, or email
    const users = await db.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        // Only active users (have employee ID)
        employeeId: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        imageUrl: true,
        department: true,
      },
      take: 10, // Limit to 10 results for dropdown
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    })

    // Format results
    const formatted = users.map(u => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      firstName: u.firstName,
      lastName: u.lastName,
      title: u.title || '',
      email: u.email,
      imageUrl: u.imageUrl,
      department: u.department,
    }))

    return NextResponse.json({ users: formatted })
  } catch (error) {
    console.error('Mention search error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
