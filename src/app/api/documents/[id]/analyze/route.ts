import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  summarizeDocument,
  extractActionItems,
  extractEntities,
  parseTranscript,
} from '@/lib/ai-tools/document-analyzer'

const analyzeSchema = z.object({
  analysisType: z.enum(['summary', 'action_items', 'entities', 'full']).default('full'),
  attendees: z.array(z.string()).optional(), // For transcript parsing
})

// POST /api/documents/[id]/analyze - AI analysis of document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return new NextResponse('User not found', { status: 404 })

    // Get document
    const document = await db.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            department: true,
          }
        }
      }
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // Check access
    const hasAccess =
      document.userId === user.id ||
      document.scope === 'COMPANY' ||
      (document.scope === 'TEAM' && document.user.department === user.department) ||
      document.sharedWith.includes(user.id)

    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const validated = analyzeSchema.parse(body)

    // Prepare result object
    const result: any = {
      documentId: id,
      analysisType: validated.analysisType,
    }

    // Perform AI analysis based on type
    switch (validated.analysisType) {
      case 'summary':
        result.summary = await summarizeDocument(document.content)
        break

      case 'action_items':
        result.actionItems = await extractActionItems(
          document.content,
          validated.attendees
        )
        break

      case 'entities':
        result.entities = await extractEntities(document.content)
        break

      case 'full':
        // Run all analyses in parallel
        const [summary, actionItems, entities] = await Promise.all([
          summarizeDocument(document.content),
          extractActionItems(document.content, validated.attendees),
          extractEntities(document.content),
        ])

        result.summary = summary
        result.actionItems = actionItems
        result.entities = entities
        break
    }

    // Optionally save analysis results to document metadata
    if (validated.analysisType === 'full') {
      await db.document.update({
        where: { id },
        data: {
          summary: result.summary,
          extractedEntities: result.entities,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.errors[0].message, { status: 400 })
    }
    console.error('Document analysis error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
