import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

// Encrypt API key before storing
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

// Decrypt API key when retrieving
function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = parts[1]
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const firefliesSettingsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
})

// Test Fireflies API connection
async function testFirefliesConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `
          query {
            transcripts(limit: 1) {
              id
              title
            }
          }
        `,
      }),
    })

    if (!response.ok) {
      return { success: false, error: 'Invalid API key or connection failed' }
    }

    const data = await response.json()

    if (data.errors) {
      return { success: false, error: data.errors[0]?.message || 'API returned errors' }
    }

    return { success: true }
  } catch (error) {
    console.error('Fireflies connection test error:', error)
    return { success: false, error: 'Failed to connect to Fireflies API' }
  }
}

// POST /api/settings/fireflies - Save and test Fireflies API key
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = firefliesSettingsSchema.parse(body)

    // Test the API key first
    const connectionTest = await testFirefliesConnection(validated.apiKey)

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: connectionTest.error,
          connected: false
        },
        { status: 400 }
      )
    }

    // Encrypt and save the API key
    const encryptedApiKey = encrypt(validated.apiKey)

    await db.user.update({
      where: { clerkId: userId },
      data: {
        firefliesApiKey: encryptedApiKey,
        firefliesConnected: true,
        firefliesLastSync: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Fireflies API key saved and connection verified',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fireflies settings error:', error)
    return NextResponse.json(
      { error: 'Failed to save Fireflies settings' },
      { status: 500 }
    )
  }
}

// GET /api/settings/fireflies - Get connection status
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        firefliesConnected: true,
        firefliesLastSync: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      connected: user.firefliesConnected,
      lastSync: user.firefliesLastSync,
      hasApiKey: !!user.firefliesConnected,
    })
  } catch (error) {
    console.error('Get Fireflies status error:', error)
    return NextResponse.json(
      { error: 'Failed to get Fireflies status' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/fireflies - Disconnect Fireflies
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.user.update({
      where: { clerkId: userId },
      data: {
        firefliesApiKey: null,
        firefliesConnected: false,
        firefliesLastSync: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Fireflies disconnected successfully',
    })
  } catch (error) {
    console.error('Disconnect Fireflies error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Fireflies' },
      { status: 500 }
    )
  }
}

// Export encryption functions for use in other parts of the app
export { encrypt, decrypt }
