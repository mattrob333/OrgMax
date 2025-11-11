'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Send, X, FileText, CheckSquare, Paperclip, Trash2, Upload } from 'lucide-react'
import { useChat } from 'ai/react'
import Markdown from 'react-markdown'
import { MentionAutocomplete } from '@/components/MentionAutocomplete'
import { FirefliesControls } from './FirefliesControls'

export function CopilotPanel() {
  const {
    copilotActiveTask,
    setCopilotActiveTask,
    copilotAttachedDocuments,
    addCopilotDocument,
    removeCopilotDocument,
    clearCopilotContext,
  } = useAppStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [dragType, setDragType] = useState<'task' | 'document' | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/copilot',
    body: {
      activeTask: copilotActiveTask,
      attachedDocuments: copilotAttachedDocuments,
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragType(null)

    try {
      const data = e.dataTransfer.getData('application/json')
      const item = JSON.parse(data)

      // Handle document drop
      if (item.type === 'document') {
        let content: string = item.content || ''

        if (!content.trim() && item.documentId) {
          try {
            const response = await fetch(`/api/documents/${item.documentId}`)
            if (response.ok) {
              const data = await response.json()
              content = data.document?.content || ''
            } else {
              console.error('Failed to fetch full document content:', response.statusText)
            }
          } catch (error) {
            console.error('Error fetching document content:', error)
          }
        }

        if (!content.trim()) {
          content = 'Document content unavailable. Please open the document and copy the relevant text.'
        }

        addCopilotDocument({
          id: item.documentId || `document_${Date.now()}`,
          fileName: item.fileName,
          content,
        })
      }
      // Handle task drop
      else if (item.id && item.title) {
        setCopilotActiveTask({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
        })
      }
    } catch (error) {
      console.error('Failed to parse dropped item:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()

    try {
      const dataType = e.dataTransfer.types.includes('application/json')
      if (dataType && !isDragOver) {
        // Try to peek at the data to determine type
        // Note: getData doesn't work in dragover, so we'll show generic message
        setIsDragOver(true)
        setDragType(null) // We'll show a generic drop zone
      }
    } catch (error) {
      setIsDragOver(true)
      setDragType(null)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
    setDragType(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ['.txt', '.md', '.pdf', '.doc', '.docx']
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext))

    if (!isValidType) {
      alert('Please select a .txt, .md, .pdf, .doc, or .docx file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })

      // Add to copilot context
      addCopilotDocument({
        id: `local_${Date.now()}`,
        fileName: file.name,
        content,
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file. Please try again.')
    }
  }

  const handleInputChangeWithMentions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleInputChange(e)

    // Detect @ mention
    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1)
      // Only show if @ is at start or preceded by whitespace
      const charBeforeAt = textBeforeCursor[lastAtIndex - 1]
      if (!charBeforeAt || /\s/.test(charBeforeAt)) {
        setMentionQuery(query)
        setShowMentions(true)

        // Calculate position for dropdown
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setMentionPosition({
            top: rect.top - 300, // Show above input
            left: rect.left,
          })
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (email: string, name: string) => {
    // Find the last @ and replace the query with the selected name
    const cursorPos = inputRef.current?.selectionStart || 0
    const textBeforeCursor = input.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const mentionText = `@${name} <${email}> `
      const newValue =
        input.substring(0, lastAtIndex) +
        mentionText +
        input.substring(cursorPos)

      // Update input using the event handler
      const syntheticEvent = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLInputElement>
      handleInputChange(syntheticEvent)
    }

    setShowMentions(false)
  }

  const handleFirefliesAction = (prompt: string) => {
    // Set the input value and auto-submit
    const syntheticEvent = {
      target: { value: prompt }
    } as React.ChangeEvent<HTMLInputElement>
    handleInputChange(syntheticEvent)

    // Auto-submit after a brief delay to ensure input is updated
    setTimeout(() => {
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true })
      const form = inputRef.current?.form
      if (form) {
        form.dispatchEvent(submitEvent)
      }
    }, 100)
  }

  return (
    <div className="h-full min-h-0 flex flex-col border-l border-purple-500/20 bg-gray-900/40 text-sm">
      {/* Header */}
      <div className="px-3 py-3 sm:p-4 border-b border-purple-500/20 bg-gray-900/70 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white sm:text-xl">AI Copilot</h2>
            <p className="text-xs text-gray-400 mt-1">Your intelligent assistant</p>
          </div>
          <FirefliesControls
            onActionTriggered={handleFirefliesAction}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Context Bar */}
      {(copilotActiveTask || copilotAttachedDocuments.length > 0) && (
        <div className="px-3 py-2.5 sm:p-3 bg-purple-600/10 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-purple-300 uppercase">Working Context</h3>
            <button
              onClick={clearCopilotContext}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>

          {/* Active Task */}
          {copilotActiveTask && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/20 mb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckSquare className="w-4 h-4 text-purple-300" />
                    <span className="text-sm font-medium text-white">{copilotActiveTask.title}</span>
                  </div>
                  {copilotActiveTask.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 ml-6">{copilotActiveTask.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setCopilotActiveTask(null)}
                  className="text-gray-400 hover:text-white transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Attached Documents */}
          {copilotAttachedDocuments.map((doc) => (
            <div key={doc.id} className="bg-gray-900/50 rounded-lg px-3 py-2 border border-purple-500/20 mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-300" />
                  <span className="text-sm text-white">{doc.fileName}</span>
                </div>
                <button
                  onClick={() => removeCopilotDocument(doc.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 overflow-y-auto px-3 py-4 sm:p-4 space-y-3 sm:space-y-4 transition-all ${
          isDragOver ? 'bg-purple-600/10 border-2 border-dashed border-purple-500/40' : ''
        }`}
      >
        {isDragOver && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-purple-300 font-medium">Drop here to add to context</p>
              <p className="text-sm text-gray-400 mt-2">Tasks or Documents</p>
            </div>
          </div>
        )}

        {!isDragOver && messages.length === 0 && (
          <div className="flex items-center justify-center h-full px-2">
            <div className="text-center max-w-sm">
              <h3 className="text-base font-semibold text-white sm:text-lg mb-2">Welcome to AI Copilot</h3>
              <p className="text-sm text-gray-400 mb-4">
                Drag a task here to get started, or ask me anything about your work.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Drag tasks from the Kanban board</p>
                <p>• Attach documents for context</p>
                <p>• Get help with research and problem-solving</p>
              </div>
            </div>
          </div>
        )}

        {!isDragOver && messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/70 text-gray-100 border border-purple-500/20'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{message.content}</Markdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/70 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 sm:p-4 border-t border-purple-500/20 bg-gray-900/70 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 sm:flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="copilot-file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-lg border border-purple-500/20 bg-gray-800 px-2 py-2 text-gray-300 transition-colors hover:bg-gray-700 sm:px-3"
              title="Attach local document"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChangeWithMentions}
              placeholder={copilotActiveTask ? `Ask about "${copilotActiveTask.title}"...` : 'Ask me anything...'}
              className="flex-1 min-w-0 rounded-lg border border-purple-500/20 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40 sm:px-4"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full shrink-0 rounded-lg bg-purple-600 px-3 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              <span className="text-sm font-medium sm:hidden">Send</span>
            </div>
          </button>
        </form>
      </div>

      {/* Mention Autocomplete */}
      {showMentions && (
        <MentionAutocomplete
          query={mentionQuery}
          position={mentionPosition}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
        />
      )}
    </div>
  )
}
