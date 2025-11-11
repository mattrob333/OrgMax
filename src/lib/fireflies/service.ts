import { firefliesClient } from './client'
import { GET_RECENT_TRANSCRIPTS, GET_TRANSCRIPT_BY_ID } from './queries'
import type {
  GetTranscriptsResponse,
  GetTranscriptResponse,
  FirefliesTranscript
} from './types'

/**
 * Get the most recent meeting transcript from Fireflies
 */
export async function getLastMeeting(): Promise<FirefliesTranscript | null> {
  try {
    const data = await firefliesClient.request<GetTranscriptsResponse>(
      GET_RECENT_TRANSCRIPTS,
      { limit: 1 }
    )

    if (!data.transcripts || data.transcripts.length === 0) {
      return null
    }

    return data.transcripts[0]
  } catch (error) {
    console.error('[Fireflies Service] Error fetching last meeting:', error)
    throw new Error('Failed to fetch meeting from Fireflies')
  }
}

/**
 * Get recent meetings with a limit
 */
export async function getRecentMeetings(limit: number = 10): Promise<FirefliesTranscript[]> {
  try {
    const data = await firefliesClient.request<GetTranscriptsResponse>(
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
 */
export async function getMeetingById(transcriptId: string): Promise<FirefliesTranscript | null> {
  try {
    const data = await firefliesClient.request<GetTranscriptResponse>(
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
