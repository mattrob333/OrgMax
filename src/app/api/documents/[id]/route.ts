import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Helper function to check if user can access document
async function canAccessDocument(userId: string, documentId: string): Promise<boolean> {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { user: true }
  })

  if (!doc) return false

  const currentUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!currentUser) return false

  // Owner always has access
  if (doc.userId === currentUser.id) return true

  // Check scope
  if (doc.scope === 'COMPANY') return true

  if (doc.scope === 'TEAM') {
    return currentUser.department === doc.user.department
  }

  // Check sharedWith
  if (doc.sharedWith.includes(currentUser.id)) return true

  return false
}

// GET /api/documents/[id] - Get single document with full content
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Check access
    const hasAccess = await canAccessDocument(userId, id)
    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const document = await db.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            email: true,
          }
        },
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              }
            }
          }
        }
      }
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Document fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// PATCH /api/documents/[id] - Update document metadata
const updateSchema = z.object({
  category: z.string().optional(),
  scope: z.enum(['PERSONAL', 'TEAM', 'COMPANY']).optional(),
  sharedWith: z.array(z.string()).optional(),
  summary: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    // Get document to check ownership
    const existingDoc = await db.document.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // Only owner can update
    if (existingDoc.userId !== user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = updateSchema.parse(body)

    const document = await db.document.update({
      where: { id },
      data: {
        category: validated.category,
        scope: validated.scope,
        sharedWith: validated.sharedWith,
        summary: validated.summary,
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

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Document update error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    const document = await db.document.findUnique({
      where: { id },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // Only owner or admin can delete
    const canDelete = document.userId === user.id || user.role === 'ADMIN'

    if (!canDelete) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.document.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document deletion error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
