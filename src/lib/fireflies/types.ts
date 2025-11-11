// TypeScript types for Fireflies AI API responses

export interface FirefliesSpeaker {
  id: number
  name: string
}

export interface FirefliesAttendee {
  displayName?: string
  email?: string
  phoneNumber?: string
  name?: string
  location?: string
}

export interface FirefliesAIFilters {
  task?: boolean
  question?: boolean
  pricing?: boolean
  metric?: boolean
  date_and_time?: boolean
  sentiment?: string
}

export interface FirefliesSentence {
  index: number
  text: string
  speaker_id: number
  speaker_name: string
  start_time: number  // seconds
  end_time: number    // seconds
  ai_filters?: FirefliesAIFilters
}

export interface FirefliesSummary {
  action_items?: string
  overview?: string
  keywords?: string[]
  outline?: string
  shorthand_bullet?: string
  bullet_gist?: string
  gist?: string
  short_summary?: string
}

export interface FirefliesTranscript {
  id: string
  title: string
  date: string  // EPOCH timestamp in ms
  duration: number  // minutes
  transcript_url?: string
  organizer_email?: string
  audio_url?: string
  speakers: FirefliesSpeaker[]
  summary?: FirefliesSummary
  sentences: FirefliesSentence[]
  meeting_attendees?: FirefliesAttendee[]
}

export interface GetTranscriptsResponse {
  transcripts: FirefliesTranscript[]
}

export interface GetTranscriptResponse {
  transcript: FirefliesTranscript
}
