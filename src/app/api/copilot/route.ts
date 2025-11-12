import { auth } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  extractActionItems,
  parseTranscript,
  analyzeForTasks,
  summarizeDocument,
  extractEntities,
} from '@/lib/ai-tools/document-analyzer'

const MAX_DOCUMENT_CONTEXT_CHARS = 20000
const MAX_GENERATION_TOKENS = 3500

const formatDocumentForPrompt = (content: unknown) => {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return 'No readable content provided.'
  }

  if (content.length <= MAX_DOCUMENT_CONTEXT_CHARS) {
    return content
  }

  return `${content.slice(0, MAX_DOCUMENT_CONTEXT_CHARS)}\n...[truncated for prompt length]`
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new Response('User not found', { status: 404 })

  const { messages, activeTask, attachedDocuments } = await req.json()

  // Get all employees for org chart context
  const allEmployees = await db.user.findMany({
    where: { employeeId: { not: null } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      email: true,
      employeeId: true,
      managerId: true,
    },
    orderBy: { firstName: 'asc' },
  })

  // Build context-aware system prompt
  const employeeById = new Map(allEmployees.map(emp => [emp.id, emp]))

  const hierarchyLines = allEmployees.map(emp => {
    const manager = emp.managerId ? employeeById.get(emp.managerId) : null
    const directReports = allEmployees
      .filter(child => child.managerId === emp.id)
      .map(child => `${child.firstName} ${child.lastName}`)

    const managerText = manager ? `${manager.firstName} ${manager.lastName} (${manager.title || 'Unknown'})` : 'No manager (top of org chart)'
    const reportsText = directReports.length > 0 ? directReports.join(', ') : 'None'

    return `- ${emp.firstName} ${emp.lastName} (${emp.title || 'N/A'})
  • Email: ${emp.email}
  • Department: ${emp.department || 'N/A'}
  • Reports to: ${managerText}
  • Direct reports: ${reportsText}`
  }).join('\n\n')

  let systemPrompt = `You are an intelligent AI copilot assistant helping ${user.firstName} ${user.lastName} with their work.

Your capabilities:
- Search the internet for up-to-date information
- Help with task planning and execution
- Provide research assistance
- Answer questions and solve problems
- Create tasks and assign them to team members
- Analyze documents and extract action items
- Access meeting transcripts from Fireflies AI
- Sync recent meetings and create tasks from action items
- Match meeting speakers to team members

Always be helpful, concise, and professional.

**ORGANIZATION CHART & REPORTING LINES:**
Each employee record includes a managerId that defines who they report to. Use this data as the authoritative source when the user asks about reporting structure, chains of command, or team composition. Provide direct answers using the hierarchy below.

${hierarchyLines}

When creating tasks, you can assign them to any of these team members using their email address. When answering org questions, cite the reporting lines from this list.`

  // Add active task context
  if (activeTask) {
    systemPrompt += `\n\n**ACTIVE TASK CONTEXT:**
Title: ${activeTask.title}
${activeTask.description ? `Description: ${activeTask.description}` : ''}
Status: ${activeTask.status}
Priority: ${activeTask.priority}

The user is currently working on this task. Provide specific, actionable help related to completing this task.`
  }

  // Add document context
  if (attachedDocuments && attachedDocuments.length > 0) {
    systemPrompt += `\n\n**ATTACHED DOCUMENTS:**\n`
    attachedDocuments.forEach((doc: any) => {
      systemPrompt += `\n--- ${doc.fileName} ---\n${formatDocumentForPrompt(doc.content)}\n`
    })
    systemPrompt += `\nUse the information from these documents to provide more informed answers.`
  }

  // Using GPT-4o for better reasoning and tool calling (internet search via searchWeb tool)
  // Alternative: Could use Perplexity's sonar model with built-in internet search
  // by adding @ai-sdk/perplexity package and using: createPerplexity()('sonar')
  try {
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      tools: {
      searchWeb: {
        description: 'Search the internet for current information, news, research, or answers to questions',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          try {
            // Use Exa MCP server for web search
            const searchUrl = `http://localhost:3000/mcp/exa/search?q=${encodeURIComponent(query)}`
            const response = await fetch(searchUrl)

            if (!response.ok) {
              return { error: 'Search failed', results: [] }
            }

            const data = await response.json()

            // Format results for the AI
            const formattedResults = data.results?.slice(0, 5).map((result: any) => ({
              title: result.title,
              url: result.url,
              snippet: result.snippet || result.text?.substring(0, 200),
            })) || []

            return {
              query,
              results: formattedResults,
              summary: `Found ${formattedResults.length} results for "${query}"`,
            }
          } catch (error) {
            console.error('Web search error:', error)
            return { error: 'Search service unavailable', results: [] }
          }
        },
      },
      updateTaskStatus: {
        description: 'Update the status of a task',
        parameters: z.object({
          taskId: z.string().describe('The ID of the task to update'),
          status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).describe('The new status'),
        }),
        execute: async ({ taskId, status }) => {
          try {
            const task = await db.task.findUnique({
              where: { id: taskId },
            })

            if (!task) {
              return { success: false, error: 'Task not found' }
            }

            // Check permissions
            const canUpdate = task.createdById === user.id || task.assignedToId === user.id

            if (!canUpdate) {
              return { success: false, error: 'Not authorized to update this task' }
            }

            await db.task.update({
              where: { id: taskId },
              data: { status },
            })

            return { success: true, message: `Task status updated to ${status}` }
          } catch (error) {
            console.error('Task update error:', error)
            return { success: false, error: 'Failed to update task' }
          }
        },
      },
      addTaskComment: {
        description: 'Add a comment to a task',
        parameters: z.object({
          taskId: z.string().describe('The ID of the task'),
          content: z.string().describe('The comment content'),
        }),
        execute: async ({ taskId, content }) => {
          try {
            const task = await db.task.findUnique({
              where: { id: taskId },
            })

            if (!task) {
              return { success: false, error: 'Task not found' }
            }

            await db.taskComment.create({
              data: {
                taskId,
                userId: user.id,
                content,
              },
            })

            return { success: true, message: 'Comment added successfully' }
          } catch (error) {
            console.error('Comment creation error:', error)
            return { success: false, error: 'Failed to add comment' }
          }
        },
      },
      createTask: {
        description: 'Create a new task, optionally assigning it to a team member by their email',
        parameters: z.object({
          title: z.string().describe('Clear, action-oriented task title'),
          description: z.string().optional().describe('Additional task details'),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').describe('Task priority'),
          assignedToEmail: z.string().email().optional().describe('Email of team member to assign'),
          dueDate: z.string().optional().describe('Due date in ISO format'),
          sourceDocumentId: z.string().optional().describe('ID of source document if task is from document analysis'),
        }),
        execute: async ({ title, description, priority, assignedToEmail, dueDate, sourceDocumentId }) => {
          try {
            let assignedToId: string | null = null

            // Find assignee by email if provided
            if (assignedToEmail) {
              const assignee = await db.user.findUnique({
                where: { email: assignedToEmail },
              })
              if (assignee) {
                assignedToId = assignee.id
              } else {
                return { success: false, error: `User not found: ${assignedToEmail}` }
              }
            }

            // Create task
            const task = await db.task.create({
              data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdById: user.id,
                assignedToId,
                sourceType: sourceDocumentId ? 'DOCUMENT' : 'COPILOT',
                sourceDocumentId,
                aiGenerated: true,
                status: 'TODO',
              },
              include: {
                assignedTo: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            })

            // Create notification for assignee
            if (assignedToId) {
              await db.notification.create({
                data: {
                  userId: assignedToId,
                  type: 'TASK_ASSIGNED',
                  title: 'New task assigned',
                  message: `${user.firstName} assigned you: ${title}`,
                },
              })
            }

            // Link to source document if provided
            if (sourceDocumentId) {
              await db.taskDocument.create({
                data: {
                  taskId: task.id,
                  documentId: sourceDocumentId,
                  linkType: 'SOURCE',
                },
              })
            }

            return {
              success: true,
              task: {
                id: task.id,
                title: task.title,
                assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : null,
              },
              message: `Task created${assignedToId ? ` and assigned to ${task.assignedTo?.email}` : ''}`,
            }
          } catch (error) {
            console.error('Task creation error:', error)
            return { success: false, error: 'Failed to create task' }
          }
        },
      },
      analyzeDocument: {
        description: 'Analyze a document to extract summaries and actionable insights',
        parameters: z.object({
          documentId: z.string().describe('ID of the document to analyze'),
          analysisType: z.enum(['summary', 'action_items', 'entities', 'full']).default('full').describe('Type of analysis to perform'),
        }),
        execute: async ({ documentId, analysisType }) => {
          try {
            // Prefer cached summary when provided by the client payload.
            let docContent = attachedDocuments?.find((doc: any) => doc.id === documentId)?.content

            if (!docContent) {
              const document = await db.document.findUnique({
                where: { id: documentId },
                include: {
                  user: {
                    select: {
                      department: true,
                    },
                  },
                },
              })

              if (!document) {
                return { success: false, error: 'Document not found' }
              }

              const hasAccess =
                document.userId === user.id ||
                document.scope === 'COMPANY' ||
                (document.scope === 'TEAM' && document.user.department === user.department) ||
                document.sharedWith.includes(user.id)

              if (!hasAccess) {
                return { success: false, error: 'Access denied to this document' }
              }

              docContent = document.content
            }

            const result: any = {
              documentId,
            }

            switch (analysisType) {
              case 'summary':
                result.summary = await summarizeDocument(docContent)
                break
              case 'action_items':
                result.actionItems = await extractActionItems(docContent)
                break
              case 'entities':
                result.entities = await extractEntities(docContent)
                break
              case 'full':
                const [summary, actionItems, entities] = await Promise.all([
                  summarizeDocument(docContent),
                  extractActionItems(docContent),
                  extractEntities(docContent),
                ])
                result.summary = summary
                result.actionItems = actionItems
                result.entities = entities
                break
            }

            return {
              success: true,
              ...result,
              message: 'Document analyzed successfully',
            }
          } catch (error) {
            console.error('Document analysis error:', error)
            return { success: false, error: 'Failed to analyze document' }
          }
        },
      },
      parseTranscript: {
        description: 'Parse a meeting transcript to extract attendees, decisions, action items, and summary',
        parameters: z.object({
          transcriptText: z.string().describe('The meeting transcript text to parse'),
        }),
        execute: async ({ transcriptText }) => {
          try {
            const parsed = await parseTranscript(transcriptText)

            return {
              success: true,
              summary: parsed.summary,
              attendees: parsed.attendees,
              topics: parsed.topics,
              decisions: parsed.decisions,
              actionItems: parsed.actionItems,
              nextSteps: parsed.nextSteps,
              openQuestions: parsed.openQuestions,
              message: `Transcript parsed successfully. Found ${parsed.actionItems.length} action items.`,
            }
          } catch (error) {
            console.error('Transcript parsing error:', error)
            return { success: false, error: 'Failed to parse transcript' }
          }
        },
      },
      searchTeamMembers: {
        description: 'Search for team members to mention or assign tasks to',
        parameters: z.object({
          query: z.string().describe('Search query (name, email, or title)'),
        }),
        execute: async ({ query }) => {
          try {
            if (!query || query.length < 1) {
              return { success: false, error: 'Query too short' }
            }

            const users = await db.user.findMany({
              where: {
                OR: [
                  { firstName: { contains: query, mode: 'insensitive' } },
                  { lastName: { contains: query, mode: 'insensitive' } },
                  { title: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
                ],
                employeeId: { not: null },
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
                email: true,
                department: true,
              },
              take: 10,
            })

            const formattedUsers = users.map(u => ({
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              email: u.email,
              title: u.title || '',
              department: u.department || '',
            }))

            return {
              success: true,
              users: formattedUsers,
              message: `Found ${formattedUsers.length} team members matching "${query}"`,
            }
          } catch (error) {
            console.error('Team search error:', error)
            return { success: false, error: 'Failed to search team members' }
          }
        },
      },
      getLastMeeting: {
        description: 'Get the most recent meeting transcript from Fireflies AI',
        parameters: z.object({}),
        execute: async () => {
          try {
            const { getLastMeeting } = await import('@/lib/fireflies/service')

            const meeting = await getLastMeeting(userId)

            if (!meeting) {
              return { success: false, error: 'No meetings found' }
            }

            const transcriptText = meeting.sentences
              ?.map(sentence => {
                const speaker = sentence.speaker_name || meeting.speakers.find(s => s.id === sentence.speaker_id)?.name
                const prefix = speaker ? `${speaker}: ` : ''
                return `${prefix}${sentence.text}`.trim()
              })
              .filter(Boolean)
              .join('\n')

            return {
              success: true,
              meeting: {
                id: meeting.id,
                title: meeting.title,
                date: new Date(parseInt(meeting.date)).toLocaleString(),
                duration: `${meeting.duration} minutes`,
                speakers: meeting.speakers.map(s => s.name),
                summary: meeting.summary?.overview,
                actionItems: meeting.summary?.action_items,
                keywords: meeting.summary?.keywords,
                transcriptUrl: meeting.transcript_url,
                transcriptText,
              },
              message: `Retrieved last meeting: ${meeting.title}`,
            }
          } catch (error) {
            console.error('Get last meeting error:', error)
            return { success: false, error: 'Failed to fetch last meeting from Fireflies' }
          }
        },
      },
      syncMeetings: {
        description: 'Sync recent meetings from Fireflies AI to the database (Admin only)',
        parameters: z.object({
          limit: z.number().min(1).max(50).default(10).describe('Number of meetings to sync'),
        }),
        execute: async ({ limit }) => {
          try {
            // Check if user is admin
            if (user.role !== 'ADMIN') {
              return { success: false, error: 'Admin access required to sync meetings' }
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meetings/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ limit }),
            })

            if (!response.ok) {
              return { success: false, error: 'Failed to sync meetings' }
            }

            const data = await response.json()

            return {
              success: true,
              synced: data.synced,
              skipped: data.skipped,
              total: data.total,
              message: `Synced ${data.synced} new meetings (${data.skipped} already existed)`,
            }
          } catch (error) {
            console.error('Sync meetings error:', error)
            return { success: false, error: 'Failed to sync meetings from Fireflies' }
          }
        },
      },
      getMeetingById: {
        description: 'Get details of a specific meeting from the database',
        parameters: z.object({
          meetingId: z.string().describe('The database ID of the meeting'),
        }),
        execute: async ({ meetingId }) => {
          try {
            const meeting = await db.meeting.findUnique({
              where: { id: meetingId },
              include: {
                speakers: {
                  include: {
                    matchedUser: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
                tasks: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    assignedTo: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    sentences: true,
                  },
                },
              },
            })

            if (!meeting) {
              return { success: false, error: 'Meeting not found' }
            }

            return {
              success: true,
              meeting: {
                id: meeting.id,
                title: meeting.title,
                date: meeting.date.toLocaleString(),
                duration: `${meeting.duration} minutes`,
                speakers: meeting.speakers.map(s => ({
                  name: s.speakerName,
                  matchedUser: s.matchedUser ? `${s.matchedUser.firstName} ${s.matchedUser.lastName}` : null,
                  confidence: s.matchConfidence,
                })),
                summary: meeting.summary,
                actionItems: meeting.actionItems,
                keywords: meeting.keywords,
                transcriptUrl: meeting.transcriptUrl,
                tasksCount: meeting.tasks.length,
                tasks: meeting.tasks,
                sentencesCount: meeting._count.sentences,
              },
              message: `Retrieved meeting: ${meeting.title}`,
            }
          } catch (error) {
            console.error('Get meeting error:', error)
            return { success: false, error: 'Failed to retrieve meeting details' }
          }
        },
      },
      createTasksFromMeeting: {
        description: 'Create tasks from action items in a meeting transcript',
        parameters: z.object({
          meetingId: z.string().describe('The database ID of the meeting'),
        }),
        execute: async ({ meetingId }) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meetings/${meetingId}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
              const error = await response.json()
              return { success: false, error: error.details || 'Failed to create tasks' }
            }

            const data = await response.json()

            return {
              success: true,
              tasksCreated: data.tasks.length,
              tasks: data.tasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned',
              })),
              message: data.message,
            }
          } catch (error) {
            console.error('Create tasks from meeting error:', error)
            return { success: false, error: 'Failed to create tasks from meeting' }
          }
        },
      },
      },
      maxTokens: MAX_GENERATION_TOKENS,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Copilot streaming error:', error)
    return new Response(
      JSON.stringify({
        error: 'The copilot was unable to generate a response. Please try again or simplify the attached context.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
