import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getRecentMeetings } from '@/lib/fireflies/service'
import { matchSpeakersToUsers } from '@/lib/fireflies/speaker-matcher'

// POST /api/meetings/sync - Sync meetings from Fireflies
export async function POST(req: NextRequest) {
  console.log('[/api/meetings/sync] POST request received')

  try {
    const { userId } = await auth()

    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId: userId } })

    if (!user) return new NextResponse('User not found', { status: 404 })

    // Only admins can sync meetings
    if (user.role !== 'ADMIN') {
      return new NextResponse('Forbidden: Admin access required', { status: 403 })
    }

    // Parse body for optional limit
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 10

    console.log(`[/api/meetings/sync] Fetching ${limit} meetings from Fireflies`)

    // Fetch meetings from Fireflies
    const meetings = await getRecentMeetings(userId, limit)

    console.log(`[/api/meetings/sync] Received ${meetings.length} meetings from Fireflies`)

    let syncedCount = 0
    let skippedCount = 0

    // Sync each meeting to database
    for (const meeting of meetings) {
      // Check if meeting already exists
      const existing = await db.meeting.findUnique({
        where: { firefliesId: meeting.id }
      })

      if (existing) {
        console.log(`[/api/meetings/sync] Skipping existing meeting: ${meeting.id}`)
        skippedCount++
        continue
      }

      console.log(`[/api/meetings/sync] Syncing new meeting: ${meeting.title}`)

      // Match speakers to users
      const speakerMatches = await matchSpeakersToUsers(
        meeting.speakers,
        meeting.meeting_attendees
      )

      console.log(`[/api/meetings/sync] Matched ${speakerMatches.filter(m => m.matchedUserId).length}/${speakerMatches.length} speakers`)

      // Create meeting with speakers and sentences
      await db.meeting.create({
        data: {
          firefliesId: meeting.id,
          title: meeting.title,
          date: new Date(parseInt(meeting.date)),
          duration: meeting.duration,
          transcriptUrl: meeting.transcript_url,
          organizerEmail: meeting.organizer_email,
          audioUrl: meeting.audio_url,
          summary: meeting.summary?.overview,
          actionItems: meeting.summary?.action_items,
          keywords: meeting.summary?.keywords || [],
          overview: meeting.summary?.overview,
          speakers: {
            create: speakerMatches.map(match => ({
              speakerId: match.speakerId,
              speakerName: match.speakerName,
              matchedUserId: match.matchedUserId,
              matchConfidence: match.matchConfidence
            }))
          },
          sentences: {
            create: meeting.sentences.map(s => ({
              index: s.index,
              text: s.text,
              speakerId: s.speaker_id,
              speakerName: s.speaker_name,
              startTime: s.start_time,
              endTime: s.end_time,
              isTask: s.ai_filters?.task || false
            }))
          }
        }
      })

      syncedCount++
    }

    console.log(`[/api/meetings/sync] Sync complete: ${syncedCount} new, ${skippedCount} skipped`)

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      total: meetings.length
    })
  } catch (error) {
    console.error('[/api/meetings/sync] Error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to sync meetings',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
