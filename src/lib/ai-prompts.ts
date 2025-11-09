/**
 * AI Prompt Templates for Document Analysis and Task Generation
 */

export const AI_PROMPTS = {
  /**
   * Summarize a document
   */
  summarize: (content: string, maxLength: number = 500) => `
Summarize the following document in ${maxLength} words or less.
Focus on key points, decisions, and action items.

DOCUMENT:
${content}

Provide a clear, concise summary highlighting the most important information.

SUMMARY:
`,

  /**
   * Extract action items from document or transcript
   */
  extractActionItems: (content: string, attendees?: string[]) => `
Analyze this document/transcript and extract all action items.
${attendees ? `\nMeeting attendees: ${attendees.join(', ')}\n` : ''}

For each action item, identify:
1. The task description (clear, action-oriented - start with a verb)
2. Who should do it (assignee) - match to attendees if possible, otherwise suggest role/department
3. When it's due (if mentioned or can be inferred)
4. Priority level based on urgency and importance

DOCUMENT:
${content}

Return the action items as a JSON array with this exact structure:
[
  {
    "title": "Clear action verb + specific task",
    "description": "Additional context or details",
    "assignee": "Person's name or email (if identifiable)",
    "dueDate": "ISO date string or null",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  }
]

Important:
- Only extract clear, actionable items (not general discussion points)
- Be specific with task titles
- If no clear assignee, leave assignee as null
- Priority: URGENT (< 24hrs), HIGH (this week), MEDIUM (this month), LOW (no deadline)

ACTION ITEMS:
`,

  /**
   * Extract entities (people, dates, topics) from document
   */
  extractEntities: (content: string) => `
Extract key entities from this document:

DOCUMENT:
${content}

Return as JSON with this exact structure:
{
  "people": ["Names of people mentioned (first and last name if possible)"],
  "dates": ["Important dates in ISO format YYYY-MM-DD"],
  "topics": ["Main topics/themes discussed"],
  "decisions": ["Key decisions made"],
  "questions": ["Unresolved questions or open items"]
}

ENTITIES:
`,

  /**
   * Parse meeting transcript comprehensively
   */
  parseTranscript: (content: string) => `
Parse this meeting transcript and extract structured information.

TRANSCRIPT:
${content}

Return as JSON with this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the meeting",
  "attendees": ["List of attendees if mentioned"],
  "topics": ["Main discussion topics"],
  "decisions": ["Specific decisions made"],
  "actionItems": [
    {
      "title": "Action-oriented task description",
      "assignee": "Person name or email",
      "dueDate": "ISO date or null",
      "priority": "MEDIUM",
      "description": "Additional context"
    }
  ],
  "nextSteps": ["General next steps or follow-ups"],
  "openQuestions": ["Unresolved questions"]
}

PARSED DATA:
`,

  /**
   * Analyze document and suggest tasks with @mentions
   */
  analyzeForTasks: (content: string, teamMembers: Array<{ name: string; email: string; title?: string }>) => `
Analyze this document and suggest specific, actionable tasks that should be created.

DOCUMENT:
${content}

AVAILABLE TEAM MEMBERS:
${teamMembers.map(m => `- ${m.name} (${m.email})${m.title ? ` - ${m.title}` : ''}`).join('\n')}

For each task you identify:
1. Write a clear, action-oriented title (start with verb)
2. Match to appropriate team member based on their role/expertise
3. Set realistic priority and due date
4. Include relevant context in description

Return as JSON array:
[
  {
    "title": "Specific action to take",
    "description": "Context and details",
    "assigneeEmail": "team.member@email.com",
    "priority": "MEDIUM",
    "dueDate": "YYYY-MM-DD or null",
    "reasoning": "Why this person for this task"
  }
]

Only suggest high-value, actionable tasks (not just general discussion points).

SUGGESTED TASKS:
`,

  /**
   * Smart email/name matching for @mentions
   */
  matchMentionToUser: (mentionText: string, possibleUsers: Array<{ name: string; email: string; title?: string }>) => `
A user typed this in a message: "@${mentionText}"

Match it to the most likely person from this list:

POSSIBLE MATCHES:
${possibleUsers.map((u, i) => `${i + 1}. ${u.name} (${u.email})${u.title ? ` - ${u.title}` : ''}`).join('\n')}

Return ONLY the index number (1-${possibleUsers.length}) of the best match, or 0 if no good match.
Consider name similarity, partial matches, and typos.

BEST MATCH INDEX:
`,

  /**
   * Generate document summary with key insights
   */
  generateInsights: (content: string) => `
Analyze this document and provide key insights:

DOCUMENT:
${content}

Return as JSON:
{
  "summary": "2-3 sentence overview",
  "keyInsights": ["Most important takeaways (3-5 items)"],
  "recommendations": ["Suggested actions or next steps"],
  "risks": ["Potential risks or concerns identified"],
  "opportunities": ["Opportunities to pursue"]
}

INSIGHTS:
`,
}

/**
 * System prompts for different AI contexts
 */
export const SYSTEM_PROMPTS = {
  documentAnalyzer: `You are an expert document analyst. Your role is to:
- Extract actionable information from documents and transcripts
- Identify clear action items with appropriate owners
- Recognize important dates, decisions, and topics
- Provide concise, accurate summaries
- Match tasks to team members based on context and expertise

Always return valid JSON when requested. Be specific and actionable.`,

  taskCreator: `You are a task management assistant. Your role is to:
- Create clear, actionable task titles (start with verbs)
- Assign appropriate priority levels
- Suggest realistic due dates
- Match tasks to the right team members
- Provide helpful context in descriptions

Focus on high-value, specific tasks (not vague todos).`,

  mentionResolver: `You are a name-matching assistant. Your role is to:
- Match partial names, nicknames, and typos to actual people
- Consider context clues (titles, departments, roles)
- Handle first name only, last name only, or full name mentions
- Return confident matches only

Be conservative - if uncertain, return 0 (no match).`,
}
