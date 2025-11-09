export const FEATURES = {
  // Phase 1
  WORKSPACE_MODE: process.env.NEXT_PUBLIC_FEATURE_WORKSPACE === 'true',

  // Phase 2
  TASK_MANAGEMENT: process.env.NEXT_PUBLIC_FEATURE_TASKS === 'true',

  // Phase 3
  KNOWLEDGE_BASE: process.env.NEXT_PUBLIC_FEATURE_DOCS === 'true',

  // Phase 4
  COPILOT_PANEL: process.env.NEXT_PUBLIC_FEATURE_COPILOT === 'true',

  // Phase 5
  MENTIONS: process.env.NEXT_PUBLIC_FEATURE_MENTIONS === 'true',
  TRANSCRIPTS: process.env.NEXT_PUBLIC_FEATURE_TRANSCRIPTS === 'true',
} as const

export type FeatureFlag = keyof typeof FEATURES
