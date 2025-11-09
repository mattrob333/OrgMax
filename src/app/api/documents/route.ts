import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// GET /api/documents - List documents with filters
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      OR: [
        { userId: user.id }, // User's own documents
        { scope: 'COMPANY' }, // Company-wide documents
        { sharedWith: { has: user.id } }, // Shared with user
        // TEAM scope - same department
        {
          AND: [
            { scope: 'TEAM' },
            { user: { department: user.department } }
          ]
        }
      ]
    }

    // Apply filters
    if (scope) {
      where.scope = scope
    }
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await db.document.count({ where })

    // Get documents (without full content for list view)
    const documents = await db.document.findMany({
      where,
      select: {
        id: true,
        userId: true,
        scope: true,
        category: true,
        fileName: true,
        fileType: true,
        summary: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          }
        },
        _count: {
          select: {
            tasks: true, // Count linked tasks
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      documents,
      total,
      page,
      limit,
      hasMore: total > page * limit,
    })
  } catch (error) {
    console.error('Document list error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// POST /api/documents - Upload new document
const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string(),
  content: z.string(),
  scope: z.enum(['PERSONAL', 'TEAM', 'COMPANY']).default('PERSONAL'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  analyzeOnUpload: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const body = await req.json()
    const validated = uploadSchema.parse(body)

    // Validate file size (5MB limit for text content)
    const sizeInMB = new Blob([validated.content]).size / (1024 * 1024)
    if (sizeInMB > 5) {
      return new NextResponse('File too large (max 5MB)', { status: 400 })
    }

    // Create document
    const document = await db.document.create({
      data: {
        userId: user.id,
        fileName: validated.fileName,
        fileType: validated.fileType,
        content: validated.content,
        scope: validated.scope,
        category: validated.category,
        metadata: {
          uploadedBy: user.id,
          uploadedByName: `${user.firstName} ${user.lastName}`,
          fileSize: sizeInMB,
          tags: validated.tags || [],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          }
        }
      }
    })

    // If analyzeOnUpload is true, trigger AI analysis
    // (We'll implement this in Phase 3)

    return NextResponse.json({ document, success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Document upload error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
