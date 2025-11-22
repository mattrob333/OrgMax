'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Calendar, Clock } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { getInitials } from '@/lib/utils'
import { Message, User } from '@/types'

interface ChatHistoryData {
  id: string
  messages: Message[]
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'imageUrl' | 'email'>
  employee: Pick<User, 'id' | 'firstName' | 'lastName' | 'imageUrl' | 'email'>
  isActive: boolean
  lastActivityAt: string
  endedAt: string | null
  createdAt: string
}

interface ChatHistoryModalProps {
  chatId: string | null
  isOpen: boolean
  onClose: () => void
}

const BotIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zm8.25.625a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-3 5.25a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-3 5.25a.375.375 0 11-.75 0 .375.375 0 01.75 0zm2.625.375a.375.375 0 100-.75.375.375 0 000 .75zm-11.5-4.5a.375.375 0 100-.75.375.375 0 000 .75z" clipRule="evenodd" />
  </svg>
)

const UserIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
)

const formatMessageTime = (date: Date | string) => {
  const messageDate = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - messageDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return messageDate.toLocaleDateString()
}

const formatChatDate = (date: Date | string) => {
  const chatDate = date instanceof Date ? date : new Date(date)
  return chatDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface ChatMessageProps {
  message: Message
  employeeImage?: string
  employeeInitials: string
  userImage?: string
  userInitials: string
}

const ChatMessage = ({ message, employeeImage, employeeInitials, userImage, userInitials }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAssistant ? 'bg-[var(--orb-purple)]/20 text-brand-accent' : 'bg-gray-700 text-gray-400'}`}>
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
          userImage ? (
            <Image
              src={userImage}
              alt={userInitials}
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <UserIcon className="h-5 w-5" />
          )
        )}
      </div>
      <div className="max-w-xs md:max-w-md rounded-lg bg-gray-800 p-3 text-sm text-gray-200">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-brand-accent font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-brand-accentSoft">{children}</em>,
              code: ({ children }) => <code className="bg-gray-700 px-1.5 py-0.5 rounded text-brand-accentSoft text-xs">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-700 p-3 rounded-lg overflow-x-auto text-xs">{children}</pre>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-200">{children}</li>,
              h1: ({ children }) => <h1 className="text-lg font-bold text-brand-accent mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold text-brand-accent mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-medium text-brand-accent mb-1">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function ChatHistoryModal({ chatId, isOpen, onClose }: ChatHistoryModalProps) {
  const [chatData, setChatData] = useState<ChatHistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && chatId) {
      fetchChatHistory()
    }
  }, [isOpen, chatId])

  const fetchChatHistory = async () => {
    if (!chatId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/chat/history?chatId=${chatId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch chat history')
      }

      const data = await response.json()
      setChatData(data)
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
      setError(error instanceof Error ? error.message : 'Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messagesRef.current && chatData?.messages) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [chatData?.messages])

  if (!isOpen) return null

  const userName = chatData ? `${chatData.user.firstName} ${chatData.user.lastName}`.trim() : ''
  const employeeName = chatData ? `${chatData.employee.firstName} ${chatData.employee.lastName}`.trim() : ''
  const userInitials = chatData ? getInitials(chatData.user.firstName ?? undefined, chatData.user.lastName ?? undefined) : ''
  const employeeInitials = chatData ? getInitials(chatData.employee.firstName ?? undefined, chatData.employee.lastName ?? undefined) : ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ ease: "easeOut", duration: 0.2 }}
          className="flex h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-gray-900 shadow-2xl shadow-black/60 border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-brand-accent" />
              <div>
                <h2 className="text-lg font-semibold text-white">Chat History</h2>
                {chatData && (
                  <p className="text-sm text-gray-400">
                    {userName} ↔ {employeeName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Info */}
          {chatData && (
            <div className="border-b border-gray-700/50 p-4 bg-gray-800/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Started: {formatChatDate(chatData.createdAt)}</span>
                  </div>
                  {chatData.endedAt && (
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>Ended: {formatChatDate(chatData.endedAt)}</span>
                    </div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  chatData.isActive 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {chatData.isActive ? 'Active' : 'Ended'}
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div 
            ref={messagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-4 h-4 bg-brand-accent rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-4 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="ml-2">Loading chat history...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-400 mb-2">⚠️ Error</div>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {chatData && !loading && !error && (
              <>
                {chatData.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No messages in this conversation</p>
                    </div>
                  </div>
                ) : (
                  chatData.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      employeeImage={chatData.employee.imageUrl || undefined}
                      employeeInitials={employeeInitials}
                      userImage={chatData.user.imageUrl || undefined}
                      userInitials={userInitials}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="rounded-b-xl border-t border-gray-700/50 p-4 bg-gray-800/30">
            <p className="text-center text-xs text-gray-500">
              This is a read-only view of the conversation history
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}