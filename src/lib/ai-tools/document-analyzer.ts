import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import { AI_PROMPTS, SYSTEM_PROMPTS } from '@/lib/ai-prompts'

/**
 * Schema for extracted action items
 */
const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  assignee: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

/**
 * Schema for entities extraction
 */
const EntitiesSchema = z.object({
  people: z.array(z.string()),
  dates: z.array(z.string()),
  topics: z.array(z.string()),
  decisions: z.array(z.string()),
  questions: z.array(z.string()).optional(),
})

/**
 * Schema for transcript parsing
 */
const TranscriptSchema = z.object({
  summary: z.string(),
  attendees: z.array(z.string()),
  topics: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(ActionItemSchema),
  nextSteps: z.array(z.string()),
  openQuestions: z.array(z.string()).optional(),
})

/**
 * Extract action items from document or transcript
 */
export async function extractActionItems(
  content: string,
  attendees?: string[]
): Promise<z.infer<typeof ActionItemSchema>[]> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        actionItems: z.array(ActionItemSchema),
      }),
      prompt: AI_PROMPTS.extractActionItems(content, attendees),
      system: SYSTEM_PROMPTS.documentAnalyzer,
      temperature: 0.3, // Lower for more consistent extraction
    })

    return result.object.actionItems
  } catch (error) {
    console.error('Action item extraction error:', error)
    return []
  }
}

/**
 * Summarize a document
 */
export async function summarizeDocument(
  content: string,
  maxLength: number = 500
): Promise<string> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'), // Faster/cheaper for summaries
      prompt: AI_PROMPTS.summarize(content, maxLength),
      system: SYSTEM_PROMPTS.documentAnalyzer,
      maxTokens: 300,
      temperature: 0.3,
    })

    return result.text.trim()
  } catch (error) {
    console.error('Document summarization error:', error)
    return 'Error generating summary'
  }
}

/**
 * Extract entities from document
 */
export async function extractEntities(
  content: string
): Promise<z.infer<typeof EntitiesSchema>> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: EntitiesSchema,
      prompt: AI_PROMPTS.extractEntities(content),
      system: SYSTEM_PROMPTS.documentAnalyzer,
      temperature: 0.3,
    })

    return result.object
  } catch (error) {
    console.error('Entity extraction error:', error)
    return {
      people: [],
      dates: [],
      topics: [],
      decisions: [],
      questions: [],
    }
  }
}

/**
 * Parse meeting transcript comprehensively
 */
export async function parseTranscript(
  content: string
): Promise<z.infer<typeof TranscriptSchema>> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: TranscriptSchema,
      prompt: AI_PROMPTS.parseTranscript(content),
      system: SYSTEM_PROMPTS.documentAnalyzer,
      temperature: 0.3,
    })

    return result.object
  } catch (error) {
    console.error('Transcript parsing error:', error)
    return {
      summary: 'Error parsing transcript',
      attendees: [],
      topics: [],
      decisions: [],
      actionItems: [],
      nextSteps: [],
      openQuestions: [],
    }
  }
}

/**
 * Analyze document and suggest tasks with team member matching
 */
export async function analyzeForTasks(
  content: string,
  teamMembers: Array<{ name: string; email: string; title?: string }>
): Promise<Array<{
  title: string
  description?: string
  assigneeEmail?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  reasoning?: string
}>> {
  try {
    const TaskSuggestionSchema = z.object({
      tasks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        assigneeEmail: z.string().email().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
        dueDate: z.string().optional().nullable(),
        reasoning: z.string().optional(),
      })),
    })

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: TaskSuggestionSchema,
      prompt: AI_PROMPTS.analyzeForTasks(content, teamMembers),
      system: SYSTEM_PROMPTS.taskCreator,
      temperature: 0.4,
    })

    return result.object.tasks
  } catch (error) {
    console.error('Task analysis error:', error)
    return []
  }
}

/**
 * Match a mention text to a user
 */
export async function matchMentionToUser(
  mentionText: string,
  possibleUsers: Array<{ name: string; email: string; title?: string }>
): Promise<number> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'), // Fast for simple matching
      prompt: AI_PROMPTS.matchMentionToUser(mentionText, possibleUsers),
      system: SYSTEM_PROMPTS.mentionResolver,
      maxTokens: 10,
      temperature: 0,
    })

    const index = parseInt(result.text.trim())
    return isNaN(index) ? 0 : index
  } catch (error) {
    console.error('Mention matching error:', error)
    return 0
  }
}

/**
 * Generate insights from document
 */
export async function generateInsights(
  content: string
): Promise<{
  summary: string
  keyInsights: string[]
  recommendations: string[]
  risks: string[]
  opportunities: string[]
}> {
  try {
    const InsightsSchema = z.object({
      summary: z.string(),
      keyInsights: z.array(z.string()),
      recommendations: z.array(z.string()),
      risks: z.array(z.string()),
      opportunities: z.array(z.string()),
    })

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: InsightsSchema,
      prompt: AI_PROMPTS.generateInsights(content),
      system: SYSTEM_PROMPTS.documentAnalyzer,
      temperature: 0.4,
    })

    return result.object
  } catch (error) {
    console.error('Insights generation error:', error)
    return {
      summary: 'Error generating insights',
      keyInsights: [],
      recommendations: [],
      risks: [],
      opportunities: [],
    }
  }
}
