import { createFirefliesClient } from './client'
import { GET_RECENT_TRANSCRIPTS, GET_TRANSCRIPT_BY_ID } from './queries'
import type {
  GetTranscriptsResponse,
  GetTranscriptResponse,
  FirefliesTranscript
} from './types'
import { db } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
const ALGORITHM = 'aes-256-cbc'

/**
 * Decrypt API key when retrieving from database
 */
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

/**
 * Get user's decrypted Fireflies API key from database
 * Falls back to global API key if user hasn't configured their own
 */
async function getUserFirefliesApiKey(userId: string): Promise<string> {
  // Check for global API key first (for development/testing)
  const globalApiKey = process.env.FIREFLIES_API_KEY

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      firefliesApiKey: true,
      firefliesConnected: true,
    },
  })

  // If user has their own API key configured, use it
  if (user?.firefliesConnected && user?.firefliesApiKey) {
    return decrypt(user.firefliesApiKey)
  }

  // Fall back to global API key if available
  if (globalApiKey) {
    console.log('[Fireflies Service] Using global API key (user has not configured personal key)')
    return globalApiKey
  }

  // No API key available
  throw new Error('Fireflies not connected. Please add your API key in Settings or configure FIREFLIES_API_KEY environment variable.')
}

/**
 * Get the most recent meeting transcript from Fireflies
 * @param userId - Clerk user ID to get Fireflies API key for
 */
export async function getLastMeeting(userId: string): Promise<FirefliesTranscript | null> {
  console.log('[Fireflies Service] getLastMeeting called for userId:', userId)

  try {
    // Step 1: Get and decrypt API key
    console.log('[Fireflies Service] Retrieving API key from database...')
    const apiKey = await getUserFirefliesApiKey(userId)
    console.log('[Fireflies Service] API key retrieved and decrypted successfully')

    // Step 2: Create Fireflies client
    const client = createFirefliesClient(apiKey)
    console.log('[Fireflies Service] Fireflies client created')

    // Step 3: Make API request
    console.log('[Fireflies Service] Requesting transcripts from Fireflies API...')
    const data = await client.request<GetTranscriptsResponse>(
      GET_RECENT_TRANSCRIPTS,
      { limit: 1 }
    )
    console.log('[Fireflies Service] API request completed')

    // Step 4: Validate response
    if (!data) {
      console.error('[Fireflies Service] No data returned from API')
      throw new Error('Empty response from Fireflies API')
    }

    if (!data.transcripts) {
      console.error('[Fireflies Service] No transcripts array in response:', JSON.stringify(data))
      throw new Error('Invalid response format from Fireflies API')
    }

    if (data.transcripts.length === 0) {
      console.log('[Fireflies Service] No meetings found in Fireflies account')
      return null
    }

    const meeting = data.transcripts[0]
    console.log('[Fireflies Service] Meeting retrieved:', {
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      hasSentences: !!meeting.sentences,
      sentenceCount: meeting.sentences?.length || 0
    })

    return meeting
  } catch (error: any) {
    // Enhanced error handling with specific cases
    console.error('[Fireflies Service] Error in getLastMeeting:', {
      error: error.message,
      stack: error.stack,
      userId
    })

    // Check for specific error types
    if (error.message?.includes('Fireflies not connected')) {
      throw error // Pass through the specific error
    }

    if (error.message?.includes('API key')) {
      throw new Error('Invalid or missing Fireflies API key. Please check your Settings.')
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to Fireflies API. Please check your internet connection.')
    }

    // Generic error
    throw new Error(`Failed to fetch meeting from Fireflies: ${error.message}`)
  }
}

/**
 * Get recent meetings with a limit
 * @param userId - Clerk user ID to get Fireflies API key for
 * @param limit - Maximum number of meetings to retrieve
 */
export async function getRecentMeetings(userId: string, limit: number = 10): Promise<FirefliesTranscript[]> {
  try {
    const apiKey = await getUserFirefliesApiKey(userId)
    const client = createFirefliesClient(apiKey)

    const data = await client.request<GetTranscriptsResponse>(
      GET_RECENT_TRANSCRIPTS,
      { limit }
    )

    return data.transcripts || []
  } catch (error) {
    console.error('[Fireflies Service] Error fetching recent meetings:', error)
    throw new Error('Failed to fetch meetings from Fireflies')
  }
}

/**
 * Get a specific meeting by Fireflies ID
 * @param userId - Clerk user ID to get Fireflies API key for
 * @param transcriptId - Fireflies transcript ID
 */
export async function getMeetingById(userId: string, transcriptId: string): Promise<FirefliesTranscript | null> {
  try {
    const apiKey = await getUserFirefliesApiKey(userId)
    const client = createFirefliesClient(apiKey)

    const data = await client.request<GetTranscriptResponse>(
      GET_TRANSCRIPT_BY_ID,
      { transcriptId }
    )

    return data.transcript || null
  } catch (error) {
    console.error('[Fireflies Service] Error fetching meeting by ID:', error)
    throw new Error('Failed to fetch meeting from Fireflies')
  }
}

/**
 * Format timestamp for display
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse action items from Fireflies summary text
 * Returns array of action item strings
 */
export function parseActionItems(actionItemsText: string): { text: string }[] {
  if (!actionItemsText) return []

  // Split by bullet points, dashes, or numbered lists
  const items = actionItemsText
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => {
      // Keep lines that look like action items
      return (
        line.startsWith('•') ||
        line.startsWith('-') ||
        line.startsWith('*') ||
        /^\d+\./.test(line) ||  // Numbered list
        line.length > 10  // Minimum length to be meaningful
      )
    })
    .map(line => {
      // Clean up formatting
      return line
        .replace(/^[•\-*]\s*/, '')  // Remove bullet points
        .replace(/^\d+\.\s*/, '')   // Remove numbers
        .trim()
    })
    .filter(line => line.length > 0)

  return items.map(text => ({ text }))
}
