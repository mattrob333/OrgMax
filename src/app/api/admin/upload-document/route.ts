import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const employeeId = formData.get('employeeId') as string

    if (!file || !employeeId) {
      return new NextResponse('Missing file or employee ID', { status: 400 })
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.md')) {
      return new NextResponse('Only .txt and .md files are allowed', { status: 400 })
    }

    // Find the user by employeeId
    const targetUser = await db.user.findUnique({
      where: { employeeId },
    })

    if (!targetUser) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    // Read file content
    const content = await file.text()
    const fileType = fileName.endsWith('.txt') ? 'txt' : 'md'

    // Delete existing document if any (one document per user for now)
    await db.document.deleteMany({
      where: { userId: targetUser.id }
    })

    // Create new document
    const document = await db.document.create({
      data: {
        userId: targetUser.id,
        fileName: file.name,
        fileType,
        content,
        metadata: {
          uploadedBy: currentUser.email,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      documentId: document.id,
      fileName: document.fileName,
      employeeName: `${targetUser.firstName} ${targetUser.lastName}`
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

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
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return new NextResponse('Missing employee ID', { status: 400 })
    }

    // Find the user by employeeId
    const targetUser = await db.user.findUnique({
      where: { employeeId },
    })

    if (!targetUser) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    // Delete the document
    await db.document.deleteMany({
      where: { userId: targetUser.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Document delete error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return new NextResponse('Missing employee ID', { status: 400 })
    }

    // Find the user by employeeId
    const targetUser = await db.user.findUnique({
      where: { employeeId },
      include: {
        documents: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
          }
        }
      }
    })

    if (!targetUser) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    return NextResponse.json({ 
      hasDocument: targetUser.documents.length > 0,
      document: targetUser.documents[0] || null
    })

  } catch (error) {
    console.error('Document fetch error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}