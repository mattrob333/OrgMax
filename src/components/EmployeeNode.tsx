'use client'

import { Handle, Position } from 'reactflow'
import Image from 'next/image'
import { NodeData } from '@/types'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'
import { User, Crown, Shield, Trash2, Link, Edit, MessageCircle } from 'lucide-react'
import CalendarIcon from './ui/CalendarIcon'
import { useState } from 'react'

interface EmployeeNodeProps {
  data: NodeData & {
    currentUserIsAdmin?: boolean
    currentUserId?: string
    hasChatHistory?: boolean
    onCalendarClick?: (user: NodeData['user']) => void
    onConnectClick?: (user: NodeData['user']) => void
    onEditClick?: (user: NodeData['user']) => void
    onChatHistoryClick?: (user: NodeData['user']) => void
  }
}

export function EmployeeNode({ data }: EmployeeNodeProps) {
  const { user, isAdmin, isFloatingAdmin, isUnconnected, currentUserIsAdmin, currentUserId, hasChatHistory, onCalendarClick, onConnectClick, onEditClick, onChatHistoryClick, onRefresh } = data
  const setActiveChatUserId = useAppStore(state => state.setActiveChatUserId)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = () => {
    setActiveChatUserId(user.id)
  }

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCalendarClick) {
      onCalendarClick(user)
    }
  }

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onConnectClick) {
      onConnectClick(user)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEditClick) {
      onEditClick(user)
    }
  }

  const handleChatHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onChatHistoryClick) {
      onChatHistoryClick(user)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!currentUserIsAdmin || user.id === currentUserId) {
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/delete-user?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the org chart with smooth transition
        if (onRefresh) {
          await onRefresh()
        } else {
          window.location.reload()
        }
      } else {
        const error = await response.text()
        alert(`Failed to delete user: ${error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete user. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
  const initials = getInitials(user.firstName || undefined, user.lastName || undefined)

  // Node styling classes based on admin and connection status
  const borderClass = isAdmin 
    ? 'border-yellow-500/70 hover:border-yellow-400' 
    : isUnconnected 
      ? 'border-orange-500/70 hover:border-orange-400' 
      : 'border-neutral-700 hover:border-purple-500/50'
  
  const shadowClass = isAdmin 
    ? 'shadow-yellow-500/20 hover:shadow-yellow-500/40' 
    : isUnconnected 
      ? 'shadow-orange-500/20 hover:shadow-orange-500/40' 
      : 'hover:shadow-purple-500/20'
      
  const glowClass = isAdmin ? 'admin-glow' : isUnconnected ? 'unconnected-glow' : 'orb-glow'

  return (
    <div 
      className="relative group cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className={`bg-gray-800/80 backdrop-blur-sm border rounded-xl p-4 shadow-lg transition-all duration-300 w-[300px] ${borderClass} ${shadowClass} ${glowClass} group-hover:shadow-lg`}>
        {/* Admin Badge */}
        {isAdmin && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" />
              {isFloatingAdmin ? 'ADMIN' : 'ADMIN'}
            </div>
          </div>
        )}

        {/* Floating Admin Indicator */}
        {isFloatingAdmin && (
          <div className="absolute -top-1 -left-1 z-10">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Shield className="w-3 h-3" />
              SYSTEM
            </div>
          </div>
        )}

        {/* Unconnected Indicator */}
        {isUnconnected && !isAdmin && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Link className="w-3 h-3" />
              UNCONNECTED
            </div>
          </div>
        )}

        {user.calendarConnected && (
          <div className="absolute -bottom-2 -left-2 z-10" title="View Calendar">
            <button
              onClick={handleCalendarClick}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Chat History button - visible when user has chat history with this employee */}
        {hasChatHistory && (
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 z-10" title="View Chat History">
            <button
              onClick={handleChatHistoryClick}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Connect button - visible for admins on ALL nodes for easy manager reassignment */}
        {currentUserIsAdmin && (
          <div className="absolute -bottom-2 -right-2 z-10" title={isUnconnected ? "Connect to Manager" : "Change Manager"}>
            <button
              onClick={handleConnectClick}
              className={`${isUnconnected 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
              } text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110`}
            >
              <Link className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Edit button - only visible for admins on hover */}
        {currentUserIsAdmin && (
          <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEditClick}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              title="Edit Employee Details"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Delete button - only visible for admins on hover, not for self */}
        {currentUserIsAdmin && user.id !== currentUserId && (
          <div className="absolute -top-2 -left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Employee"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className={`relative w-16 h-16 rounded-full overflow-hidden ${isAdmin ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} flex items-center justify-center`}>
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={displayName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white font-semibold text-lg">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center">
          <h3 className={`font-bold text-sm mb-1 transition-colors ${isAdmin ? 'text-yellow-100 group-hover:text-yellow-200' : 'text-white group-hover:text-purple-300'}`}>
            {displayName}
          </h3>
          {user.title && (
            <p className={`text-xs mb-1 font-medium ${isAdmin ? 'text-yellow-400' : 'text-purple-400'}`}>
              {user.title}
            </p>
          )}
          {user.department && (
            <p className="text-gray-400 text-xs">
              {user.department}
            </p>
          )}
          {isFloatingAdmin && (
            <p className="text-blue-400 text-xs mt-1 font-medium">
              System Administrator
            </p>
          )}
        </div>

        {/* Hover overlay */}
        <div className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${isAdmin ? 'bg-gradient-to-br from-yellow-500/0 to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10' : 'bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10'}`}></div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
} 