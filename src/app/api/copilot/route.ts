import { auth } from '@clerk/nextjs/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new Response('User not found', { status: 404 })

  const { messages, activeTask, attachedDocuments } = await req.json()

  // Build context-aware system prompt
  let systemPrompt = `You are an intelligent AI copilot assistant helping ${user.firstName} ${user.lastName} with their work.

Your capabilities:
- Search the internet for up-to-date information
- Help with task planning and execution
- Provide research assistance
- Answer questions and solve problems

Always be helpful, concise, and professional.`

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
      systemPrompt += `\n--- ${doc.fileName} ---\n${doc.content}\n`
    })
    systemPrompt += `\nUse the information from these documents to provide more informed answers.`
  }

  // Using GPT-4o for better reasoning and tool calling (internet search via searchWeb tool)
  // Alternative: Could use Perplexity's sonar model with built-in internet search
  // by adding @ai-sdk/perplexity package and using: createPerplexity()('sonar')
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
    },
    maxTokens: 1500,
    temperature: 0.7,
  })

  return result.toDataStreamResponse()
}
