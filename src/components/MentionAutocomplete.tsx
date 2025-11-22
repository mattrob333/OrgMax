'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  firstName: string
  lastName: string
  title: string
  email: string
  imageUrl?: string
  department: string
}

interface MentionAutocompleteProps {
  query: string
  position: { top: number; left: number }
  onSelect: (email: string, name: string) => void
  onClose: () => void
}

export function MentionAutocomplete({ query, position, onSelect, onClose }: MentionAutocompleteProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      if (query.length < 1) {
        setMembers([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/mentions/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        setMembers(data.users || [])
        setSelectedIndex(0)
      } catch (error) {
        console.error('Mention search error:', error)
        setMembers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, members.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && members[selectedIndex]) {
        e.preventDefault()
        const selected = members[selectedIndex]
        onSelect(selected.email, selected.name)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [members, selectedIndex, onSelect, onClose])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (members.length === 0 && !isLoading) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80 bg-gray-900 border border-white/12 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {isLoading ? (
        <div className="p-4 text-center text-gray-400">
          <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="py-1">
          {members.map((member, index) => (
            <button
              key={member.id}
              onClick={() => onSelect(member.email, member.name)}
              className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex
                  ? 'bg-brand-accent/30 text-white'
                  : 'text-gray-300 hover:bg-brand-accent/10'
              }`}
            >
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{member.name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {member.title}
                  {member.department && ` • ${member.department}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
