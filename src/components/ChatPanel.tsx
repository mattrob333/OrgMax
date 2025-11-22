'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Phone, Mail, MapPin, Briefcase, FileText, CheckSquare, User as UserIcon2 } from 'lucide-react'
import { useChat } from 'ai/react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'

// Import Panel Components
import { TaskPanel } from './tasks/TaskPanel'
import { CalendarView } from './CalendarView'
import { DocumentLibrary } from './documents/DocumentLibrary'

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
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAssistant ? 'bg-[var(--orb-purple)]/20 text-brand-accent' : 'bg-[#1a1a1a] text-gray-400'}`}>
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
      <div className="max-w-xs md:max-w-md rounded-lg bg-[#1a1a1a] p-3 text-sm text-gray-200 border border-white/5">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-lg font-bold text-brand-accent mb-2 mt-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1 mt-2">{children}</h3>,
              p: ({ children }) => <p className="mb-2 text-gray-300 leading-relaxed last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-gray-300">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-gray-300">{children}</ol>,
              li: ({ children }) => <li className="ml-1">{children}</li>,
              strong: ({ children }) => <strong className="text-brand-accent font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-gray-400 italic">{children}</em>,
              code: ({ children }) => <code className="bg-[#0f0f0f] px-1.5 py-0.5 rounded text-brand-accent font-mono text-xs">{children}</code>,
              pre: ({ children }) => <pre className="bg-[#0f0f0f] p-3 rounded-lg overflow-x-auto text-xs text-gray-300 my-2 border border-white/10">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-brand-accent pl-3 my-2 italic text-gray-400">{children}</blockquote>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">{children}</a>,
              table: ({ children }) => <div className="overflow-x-auto my-4 border border-white/10 rounded-lg"><table className="w-full text-left text-sm">{children}</table></div>,
              thead: ({ children }) => <thead className="bg-[#0f0f0f] text-gray-400 font-medium">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
              tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
              th: ({ children }) => <th className="px-4 py-3">{children}</th>,
              td: ({ children }) => <td className="px-4 py-3 text-gray-300">{children}</td>,
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'files' | 'contact'>('tasks')

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

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'contact', label: 'Contact', icon: UserIcon2 },
  ] as const

  return (
    <AnimatePresence>
      {activeChatUserId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={handleCloseChat}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ ease: "easeOut", duration: 0.2 }}
            className="flex h-[85vh] w-full max-w-6xl rounded-xl bg-[#0f0f0f] shadow-2xl shadow-black/60 border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEFT PANEL - Profile & Tools (65%) */}
            <div className="flex-1 flex flex-col border-r border-white/10 bg-[#0f0f0f] min-w-0">
              {/* Profile Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f]">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-brand-accent to-[#A8D622] flex items-center justify-center shrink-0 shadow-lg shadow-black/40 border border-white/10">
                    {selectedEmployee.imageUrl ? (
                      <Image
                        src={selectedEmployee.imageUrl}
                        alt={displayName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white font-bold text-2xl">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white truncate">{displayName}</h2>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-[#1a1a1a] border border-white/10 text-xs text-gray-400 font-medium">
                          {selectedEmployee.department || 'General'}
                        </span>
                      </div>
                    </div>
                    <p className="text-brand-accent font-medium mb-2">{selectedEmployee.title}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate max-w-[200px]">{selectedEmployee.email}</span>
                      </div>
                      {/* Cast to any to access potential future properties */}
                      {(selectedEmployee as any).phoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{(selectedEmployee as any).phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-white/10 px-4 bg-[#0f0f0f]">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === tab.id 
                          ? 'border-brand-accent text-brand-accent' 
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden bg-[#1a1a1a] relative">
                {activeTab === 'tasks' && (
                  <div className="absolute inset-0 overflow-hidden">
                    <TaskPanel userId={selectedEmployee.id} embedded={true} />
                  </div>
                )}
                {activeTab === 'calendar' && (
                  <div className="absolute inset-0 overflow-y-auto p-6">
                    <CalendarView user={selectedEmployee} className="h-full" />
                  </div>
                )}
                {activeTab === 'files' && (
                  <div className="absolute inset-0 overflow-hidden">
                    <DocumentLibrary userId={selectedEmployee.id} embedded={true} />
                  </div>
                )}
                {activeTab === 'contact' && (
                  <div className="p-8 max-w-2xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Contact Information</h3>
                    
                    <div className="grid gap-6">
                      <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                          <Mail className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email Address</p>
                          <p className="text-white text-lg select-all">{selectedEmployee.email}</p>
                        </div>
                      </div>

                      <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                          <Phone className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone Number</p>
                          <p className="text-white text-lg select-all">{(selectedEmployee as any).phoneNumber || 'Not available'}</p>
                        </div>
                      </div>

                      <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Office Location</p>
                          <p className="text-white text-lg select-all">{(selectedEmployee as any).location || 'Remote'}</p>
                        </div>
                      </div>

                      <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Role & Department</p>
                          <p className="text-white text-lg">{selectedEmployee.title}</p>
                          <p className="text-gray-400">{selectedEmployee.department}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL - AI Chat (35%) */}
            <div className="w-[400px] flex flex-col bg-[#0f0f0f] border-l border-white/10 shadow-xl">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4 bg-[#0f0f0f]">
                <div className="flex items-center gap-2">
                  <BotIcon className="w-5 h-5 text-brand-accent" />
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                </div>
                <button
                  onClick={handleCloseChat}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Message Area */}
              <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto p-4 text-sm leading-6 text-gray-300 bg-[#0f0f0f]">
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
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-[var(--orb-purple)]/10 text-brand-accent border border-brand-accent/20">
                      <BotIcon className="h-6 w-6" />
                    </div>
                    <p className="text-gray-400 mb-6 text-sm">
                      Ask about {selectedEmployee.firstName}'s availability, schedule, or projects.
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                        <button 
                          key={i} 
                          onClick={() => setInput(prompt)} 
                          className="bg-[#1a1a1a] hover:bg-[#252525] text-left text-gray-300 p-3 rounded-lg transition-colors text-xs border border-white/5"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--orb-purple)]/20 text-brand-accent">
                       <BotIcon className="h-5 w-5" />
                    </div>
                    <div className="max-w-xs rounded-lg bg-[#1a1a1a] p-3 text-sm border border-white/5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-4 bg-[#0f0f0f]">
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask a question..."
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#1a1a1a] p-3 pr-12 text-white placeholder-gray-500 transition-colors focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent/50 text-sm"
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
                      className="absolute bottom-2.5 right-3 rounded-lg p-1.5 text-gray-400 transition-colors enabled:hover:bg-brand-accent enabled:hover:text-slate-950 disabled:opacity-40"
                      disabled={!input.trim() || isLoading}
                    >
                      <SendIcon className="h-4 w-4" />
                    </button>
                  </div>
                </form>
                <p className="mt-2 text-center text-[10px] text-gray-600">
                  Connected to Grok 4.1 API
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}