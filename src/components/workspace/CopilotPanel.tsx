'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Send, X, FileText, CheckSquare, Paperclip, Trash2 } from 'lucide-react'
import { useChat } from 'ai/react'
import Markdown from 'react-markdown'

export function CopilotPanel() {
  const {
    copilotActiveTask,
    setCopilotActiveTask,
    copilotAttachedDocuments,
    removeCopilotDocument,
    clearCopilotContext,
  } = useAppStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      const task = JSON.parse(data)

      if (task && task.id) {
        setCopilotActiveTask({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
        })
      }
    } catch (error) {
      console.error('Failed to parse dropped task:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20 bg-gray-900/70">
        <h2 className="text-xl font-semibold text-white">AI Copilot</h2>
        <p className="text-xs text-gray-400 mt-1">Your intelligent assistant</p>
      </div>

      {/* Context Bar */}
      {(copilotActiveTask || copilotAttachedDocuments.length > 0) && (
        <div className="p-3 bg-purple-600/10 border-b border-purple-500/20">
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
            <div key={doc.id} className="bg-gray-900/50 rounded-lg p-2 border border-purple-500/20 mb-2 last:mb-0">
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
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all ${
          isDragOver ? 'bg-purple-600/10 border-2 border-dashed border-purple-500/40' : ''
        }`}
      >
        {isDragOver && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CheckSquare className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-purple-300 font-medium">Drop task to add to context</p>
            </div>
          </div>
        )}

        {!isDragOver && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to AI Copilot</h3>
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
      <div className="p-4 border-t border-purple-500/20 bg-gray-900/70">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-purple-500/20 text-gray-300 rounded-lg transition-colors"
            title="Attach document (coming soon)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={copilotActiveTask ? `Ask about "${copilotActiveTask.title}"...` : "Ask me anything..."}
            className="flex-1 px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
