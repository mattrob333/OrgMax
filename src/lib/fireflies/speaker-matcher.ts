import { db } from '@/lib/db'
import type { FirefliesSpeaker, FirefliesAttendee } from './types'

export interface SpeakerMatch {
  speakerId: number
  speakerName: string
  matchedUserId: string | null
  matchConfidence: number  // 0-1 confidence score
}

/**
 * Match Fireflies speakers to users in the org chart
 * Uses email matching (perfect) and fuzzy name matching (fallback)
 */
export async function matchSpeakersToUsers(
  speakers: FirefliesSpeaker[],
  attendees?: FirefliesAttendee[]
): Promise<SpeakerMatch[]> {
  // Get all users with employee IDs (active org chart members)
  const users = await db.user.findMany({
    where: { employeeId: { not: null } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  const matches: SpeakerMatch[] = []

  for (const speaker of speakers) {
    let bestMatch: typeof users[0] | null = null
    let confidence = 0

    // Strategy 1: Exact email match from attendees (100% confidence)
    if (attendees && attendees.length > 0) {
      const attendee = attendees.find(a => {
        const speakerNameLower = speaker.name.toLowerCase()
        const displayNameMatch = a.displayName?.toLowerCase() === speakerNameLower
        const emailContainsName = a.email?.toLowerCase().includes(speakerNameLower.split(' ')[0])

        return displayNameMatch || emailContainsName
      })

      if (attendee?.email) {
        const emailMatch = users.find(u =>
          u.email.toLowerCase() === attendee.email?.toLowerCase()
        )

        if (emailMatch) {
          bestMatch = emailMatch
          confidence = 1.0 // Perfect match
        }
      }
    }

    // Strategy 2: Fuzzy name matching (if no email match)
    if (!bestMatch) {
      for (const user of users) {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        const userFirstName = user.firstName?.toLowerCase() || ''
        const userLastName = user.lastName?.toLowerCase() || ''
        const speakerNameLower = speaker.name.toLowerCase()

        // Calculate similarity score
        let similarity = 0

        // Exact full name match
        if (fullName === speakerNameLower) {
          similarity = 0.95
        }
        // First name + last name token matching
        else {
          similarity = calculateNameSimilarity(speakerNameLower, fullName)

          // Boost score if first name matches exactly
          if (userFirstName && speakerNameLower.includes(userFirstName)) {
            similarity += 0.2
          }

          // Boost score if last name matches exactly
          if (userLastName && speakerNameLower.includes(userLastName)) {
            similarity += 0.2
          }

          // Cap at 0.9 for name-only matches (no email)
          similarity = Math.min(similarity, 0.9)
        }

        if (similarity > confidence && similarity > 0.6) {
          bestMatch = user
          confidence = similarity
        }
      }
    }

    matches.push({
      speakerId: speaker.id,
      speakerName: speaker.name,
      matchedUserId: bestMatch?.id || null,
      matchConfidence: confidence
    })
  }

  return matches
}

/**
 * Calculate name similarity using token-based matching
 * Returns a score between 0 and 1
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const tokens1 = name1.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  const tokens2 = name2.toLowerCase().split(/\s+/).filter(t => t.length > 0)

  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0
  }

  // Count common tokens
  let commonTokens = 0

  for (const token1 of tokens1) {
    for (const token2 of tokens2) {
      if (token1 === token2) {
        commonTokens++
        break
      }
      // Partial match (for nicknames like "Mike" vs "Michael")
      if (token1.startsWith(token2) || token2.startsWith(token1)) {
        if (Math.min(token1.length, token2.length) >= 3) {
          commonTokens += 0.7
          break
        }
      }
    }
  }

  // Normalize by the maximum number of tokens
  const maxTokens = Math.max(tokens1.length, tokens2.length)
  return commonTokens / maxTokens
}

/**
 * Find which speaker is mentioned in an action item text
 * Returns the matched user if found with high confidence
 */
export function findMentionedSpeaker(
  text: string,
  speakers: Array<{ speakerName: string; matchedUserId: string | null; matchConfidence: number }>
): { matchedUserId: string } | null {
  const textLower = text.toLowerCase()

  for (const speaker of speakers) {
    // Only consider speakers with good matches (confidence > 0.7)
    if (!speaker.matchedUserId || speaker.matchConfidence < 0.7) {
      continue
    }

    const speakerNameLower = speaker.speakerName.toLowerCase()
    const nameParts = speakerNameLower.split(/\s+/)

    // Check if any part of the speaker's name is in the text
    for (const part of nameParts) {
      if (part.length > 2 && textLower.includes(part)) {
        return { matchedUserId: speaker.matchedUserId }
      }
    }
  }

  return null
}
