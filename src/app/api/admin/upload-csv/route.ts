import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { EmployeeCSVRow } from '@/types'

const employeeSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  title: z.string().min(1),
  department: z.string().min(1),
  managerId: z.string().optional(),
  personalityType: z.enum(['professional', 'friendly', 'technical', 'creative', 'analytical', 'supportive', 'direct', 'mentor']).optional(),
  systemMessage: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return new NextResponse('CSV file must have header and data rows', { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const employees: EmployeeCSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const employeeData: any = {}
      
      headers.forEach((header, index) => {
        employeeData[header] = values[index] || undefined
      })

      try {
        const validatedEmployee = employeeSchema.parse(employeeData)
        employees.push(validatedEmployee)
      } catch (error) {
        return new NextResponse(`Invalid data in row ${i + 1}`, { status: 400 })
      }
    }

    // Check for duplicate employeeIds in the CSV itself
    const csvEmployeeIds = employees.map(emp => emp.employeeId)
    const duplicateIds = csvEmployeeIds.filter((id, index) => csvEmployeeIds.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      return new NextResponse(`Duplicate employeeIds found in CSV: ${duplicateIds.join(', ')}`, { status: 400 })
    }

    // Use a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Get all existing users to check for conflicts
      const existingUsers = await tx.user.findMany({
        select: { id: true, email: true, employeeId: true, clerkId: true }
      })

      // Check for employeeId conflicts with users not in our CSV
      const csvEmails = new Set(employees.map(emp => emp.email))
      const conflictingUsers = existingUsers.filter(user => 
        user.employeeId && 
        csvEmployeeIds.includes(user.employeeId) && 
        !csvEmails.has(user.email)
      )

      if (conflictingUsers.length > 0) {
        const conflicts = conflictingUsers.map(user => 
          `employeeId "${user.employeeId}" is already assigned to user with email "${user.email}"`
        ).join('; ')
        throw new Error(`EmployeeId conflicts detected: ${conflicts}`)
      }

      // Clear employeeId for any existing users whose emails are in the CSV
      // but will get different employeeIds
      for (const existingUser of existingUsers) {
        if (existingUser.email && csvEmails.has(existingUser.email)) {
          const csvEmployee = employees.find(emp => emp.email === existingUser.email)
          if (csvEmployee && existingUser.employeeId && existingUser.employeeId !== csvEmployee.employeeId) {
            await tx.user.update({
              where: { id: existingUser.id },
              data: { employeeId: null, managerId: null }
            })
          }
        }
      }

      const employeeMap: Record<string, string> = {} // employeeId -> db user id
      const newUsers: string[] = [] // Track emails of newly created users for invitations

      // First pass: create / update users without manager links so all ids exist
      for (const emp of employees) {
        const existingUser = existingUsers.find(u => u.email === emp.email)
        const isNewUser = !existingUser || existingUser.clerkId.startsWith('temp_')
        
        if (isNewUser) {
          newUsers.push(emp.email)
        }

        const upserted = await tx.user.upsert({
          where: { email: emp.email },
          update: {
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            title: emp.title,
            department: emp.department,
            personalityType: emp.personalityType || 'professional',
            systemMessage: emp.systemMessage,
          },
          create: {
            clerkId: `temp_${emp.employeeId}`, // Temporary, will be updated on first sign-in
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            title: emp.title,
            department: emp.department,
            personalityType: emp.personalityType || 'professional',
            systemMessage: emp.systemMessage,
          },
        })

        employeeMap[emp.employeeId] = upserted.id
      }

      // Second pass: update manager links now that all users exist
      for (const emp of employees) {
        const userId = employeeMap[emp.employeeId]
        if (!userId) continue; // Should not happen, but good practice

        // Handle different managerId scenarios:
        // - '0' means explicit root node (isExplicitRoot: true, managerId: null)
        // - Valid ID means normal manager relationship
        // - Empty/missing means unknown status (isExplicitRoot: false, managerId: null)
        let managerDbId: string | null = null
        let isExplicitRoot = false

        if (emp.managerId === '0') {
          // '0' means this is explicitly a root node
          isExplicitRoot = true
          managerDbId = null
        } else if (emp.managerId && employeeMap[emp.managerId]) {
          // Valid manager ID that exists in our employee map
          managerDbId = employeeMap[emp.managerId]
          isExplicitRoot = false
        } else {
          // Empty or invalid managerId - unknown status
          managerDbId = null
          isExplicitRoot = false
        }

        await tx.user.update({
          where: { id: userId },
          data: { 
            managerId: managerDbId,
            isExplicitRoot
          },
        })
      }

      return { employeeCount: employees.length, newUsers }
    })

    // Helper function to detect fake/demo email addresses
    const isFakeEmail = (email: string): boolean => {
      const fakeEmailPatterns = [
        '@fakedata.com',
        '@example.com',
        '@test.com',
        '@demo.com',
        '@localhost',
        '@fake.com'
      ]
      return fakeEmailPatterns.some(pattern => email.toLowerCase().includes(pattern))
    }

    // Send invitations for new users (skip fake emails)
    let invitationsSent = 0
    let invitationErrors: string[] = []
    let invitationsSkipped = 0

    if (result.newUsers.length > 0) {
      const client = await clerkClient()
      
      for (const email of result.newUsers) {
        try {
          // Skip fake/demo email addresses
          if (isFakeEmail(email)) {
            console.log(`Skipping invitation for fake email: ${email}`)
            invitationsSkipped++
            continue
          }
          // Check if user already exists in Clerk
          const existingClerkUsers = await client.users.getUserList({
            emailAddress: [email]
          })
          
          if (existingClerkUsers.data.length > 0) {
            console.log(`User ${email} already exists in Clerk, skipping invitation`)
            invitationErrors.push(`User ${email} already exists`)
            continue
          }
          
          // Check if invitation already exists - filter manually since Clerk API is unreliable
          const existingInvitations = await client.invitations.getInvitationList()
          const existingInvitation = existingInvitations.data.find(inv => inv.emailAddress === email)
          
          if (existingInvitation) {
            console.log(`Invitation for ${email} already exists with status: ${existingInvitation.status}`)
            
            // If invitation exists but is broken (wrong redirect), revoke and recreate
            if (existingInvitation.status === 'pending') {
              console.log(`Revoking existing invitation for ${email} to recreate with correct redirect URL`)
              try {
                await client.invitations.revokeInvitation(existingInvitation.id)
              } catch (revokeError) {
                console.error(`Failed to revoke invitation for ${email}:`, revokeError)
                invitationErrors.push(`Failed to revoke existing invitation for ${email}`)
                continue
              }
            } else {
              invitationErrors.push(`Invitation for ${email} already ${existingInvitation.status}`)
              continue
            }
          }
          
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                         'http://localhost:3000'
          
          await client.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: `${baseUrl}/sign-up`
          })
          invitationsSent++
        } catch (error: any) {
          console.error(`Failed to send invitation to ${email}:`, error)
          console.error('Clerk error details:', error.errors || error.message)
          const errorMessage = error.errors?.[0]?.message || error.message || 'Unknown error'
          invitationErrors.push(`Failed to invite ${email}: ${errorMessage}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: result.employeeCount,
      invitationsSent,
      invitationsSkipped,
      invitationErrors: invitationErrors.length > 0 ? invitationErrors : undefined
    })

  } catch (error) {
    console.error('CSV upload error:', error)
    if (error instanceof Error && error.message.includes('EmployeeId conflicts detected')) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
} 