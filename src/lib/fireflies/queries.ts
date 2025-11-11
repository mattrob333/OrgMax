// GraphQL queries for Fireflies AI API

export const GET_RECENT_TRANSCRIPTS = `
  query GetRecentTranscripts($limit: Int!, $userId: String) {
    transcripts(limit: $limit, user_id: $userId, mine: true) {
      id
      title
      date
      duration
      transcript_url
      organizer_email
      audio_url
      speakers {
        id
        name
      }
      summary {
        action_items
        overview
        keywords
      }
      sentences {
        index
        text
        speaker_id
        speaker_name
        start_time
        end_time
        ai_filters {
          task
        }
      }
      meeting_attendees {
        displayName
        email
      }
    }
  }
`

export const GET_TRANSCRIPT_BY_ID = `
  query GetTranscript($transcriptId: String!) {
    transcript(id: $transcriptId) {
      id
      title
      date
      duration
      transcript_url
      organizer_email
      audio_url
      speakers {
        id
        name
      }
      summary {
        action_items
        overview
        keywords
        outline
        shorthand_bullet
      }
      sentences {
        index
        text
        speaker_id
        speaker_name
        start_time
        end_time
        ai_filters {
          task
          question
          pricing
          metric
          date_and_time
          sentiment
        }
      }
      meeting_attendees {
        displayName
        email
        phoneNumber
        name
        location
      }
    }
  }
`
