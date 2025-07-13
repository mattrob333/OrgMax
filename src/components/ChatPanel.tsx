'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar } from 'lucide-react'
import { useChat } from 'ai/react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'

// ========== ICONS (self-contained SVGs) ========== //

const SendIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const BotIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zm8.25.625a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-3 5.25a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-3 5.25a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-11.5-4.5a.375.375 0 100-.75.375.375 0 000 .75z" clipRule="evenodd" />
  </svg>
);

const UserIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

interface ChatMessageProps {
  message: {
    id: string
    role: string
    content: string
  }
  employeeImage?: string
  employeeInitials: string
}

const ChatMessage = ({ message, employeeImage, employeeInitials }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAssistant ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
        {isAssistant ? (
          employeeImage ? (
            <Image
              src={employeeImage}
              alt={employeeInitials}
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <BotIcon className="h-5 w-5" />
          )
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </div>
      <div className="max-w-xs md:max-w-md rounded-lg bg-gray-800 p-3 text-sm text-gray-200">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-purple-300 font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-purple-200">{children}</em>,
              code: ({ children }) => <code className="bg-gray-700 px-1.5 py-0.5 rounded text-purple-200 text-xs">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-700 p-3 rounded-lg overflow-x-auto text-xs">{children}</pre>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-200">{children}</li>,
              h1: ({ children }) => <h1 className="text-lg font-bold text-purple-300 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold text-purple-300 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-medium text-purple-300 mb-1">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export function ChatPanel() {
  const { activeChatUserId, setActiveChatUserId, employees } = useAppStore()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const selectedEmployee = employees.find(emp => emp.id === activeChatUserId)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, setMessages } = useChat({
    api: '/api/chat',
    headers: {
      'X-Employee-Id': activeChatUserId || '',
    },
    // Add key to force recreation when user changes
    key: `chat-${activeChatUserId}`,
  })

  // Reset messages when switching users
  useEffect(() => {
    setMessages([])
  }, [activeChatUserId, setMessages])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCloseChat = async () => {
    // End the chat session when closing
    if (activeChatUserId && messages.length > 0) {
      try {
        // Get the current chat ID by finding the chat between current user and selected employee
        const response = await fetch('/api/chat/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            employeeId: activeChatUserId 
          })
        })
        // Don't wait for response, just close
      } catch (error) {
        console.error('Failed to end chat:', error)
        // Still close the chat even if ending fails
      }
    }
    setActiveChatUserId(null)
  }

  if (!selectedEmployee) return null

  const displayName = `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || 'Unknown User'
  const initials = getInitials(selectedEmployee.firstName || undefined, selectedEmployee.lastName || undefined)

  const suggestedPrompts = selectedEmployee.calendarConnected ? [
    `What's your availability this week?`,
    `Can we schedule a 15-min meeting tomorrow?`,
    `Book a 30-minute meeting this Friday`,
    `Tell me about your current projects`,
    `What meetings do you have today?`,
    `When are you free for a quick call?`
  ] : [
    `Tell me about your current projects`,
    `What's your role in the organization?`,
    `What skills do you have?`,
    `How can I get in touch with you?`
  ];

  return (
    <AnimatePresence>
      {activeChatUserId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={handleCloseChat}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ ease: "easeOut", duration: 0.2 }}
            className="flex h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-gray-900 shadow-2xl shadow-purple-900/10 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between rounded-t-xl border-b border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  {selectedEmployee.imageUrl ? (
                    <Image
                      src={selectedEmployee.imageUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white font-medium text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{displayName}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-400"></span>
                      <p className="text-xs text-gray-400">{selectedEmployee.title}</p>
                    </div>
                    {selectedEmployee.calendarConnected && (
                      <div className="flex items-center gap-1" title="Calendar connected - can schedule meetings">
                        <Calendar className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">Calendar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Message Area */}
            <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto p-4 text-sm leading-6 text-gray-300">
              {messages.length > 0 ? (
                messages.map(m => (
                  <ChatMessage 
                    key={m.id} 
                    message={m} 
                    employeeImage={selectedEmployee.imageUrl || undefined}
                    employeeInitials={initials}
                  />
                ))
              ) : (
                // Initial state with suggested prompts
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-purple-600/20 text-purple-400">
                    <BotIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Chat with {displayName}</h3>
                  <p className="text-gray-400 mb-4">How can I help you today?</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                    {suggestedPrompts.map((prompt, i) => (
                      <button 
                        key={i} 
                        onClick={() => setInput(prompt)} 
                        className="bg-gray-800 hover:bg-gray-700/80 text-left text-gray-300 p-3 rounded-lg transition-colors text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  {!selectedEmployee.calendarConnected && (
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        Calendar not connected - scheduling features limited
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-purple-400">
                     <BotIcon className="h-5 w-5" />
                  </div>
                  <div className="max-w-xs md:max-w-md rounded-lg bg-gray-800 p-3 text-sm text-gray-200">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="rounded-b-xl border-t border-gray-700/50 p-4">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder={`Ask ${displayName} about their availability, schedule, or projects...`}
                    className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 p-3 pr-12 text-white placeholder-gray-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute bottom-2.5 right-3 rounded-lg p-1.5 text-gray-400 transition-colors enabled:hover:bg-purple-600 enabled:hover:text-white disabled:opacity-40"
                    disabled={!input.trim() || isLoading}
                  >
                    <SendIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <p className="mt-2 text-center text-xs text-gray-500">
                AI responses are based on employee data and may not reflect real-time information.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}