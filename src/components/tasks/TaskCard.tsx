'use client'

import { useState } from 'react'
import { Calendar, User, ChevronDown, ChevronUp, MessageSquare, Trash2 } from 'lucide-react'

interface TaskComment {
  id: string
  content: string
  createdAt: Date | string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | string | null
  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
  assignedTo?: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
  comments?: TaskComment[]
}

interface TaskCardProps {
  task: Task
  onUpdate?: () => void
}

const priorityColors = {
  LOW: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  URGENT: 'text-red-400 bg-red-500/10 border-red-500/20',
}

const statusOptions = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)

  const formatDate = (date?: Date | string | null) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (date?: Date | string | null) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    setIsUpdatingPriority(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (res.ok) {
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update priority:', error)
    } finally {
      setIsUpdatingPriority(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        setNewComment('')
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(task))
        e.dataTransfer.effectAllowed = 'copy'
      }}
      className="bg-[#0f0f0f] border border-white/10 rounded-lg hover:border-brand-accent/40 transition-all group"
    >
      {/* Collapsed view */}
      <div
        onClick={handleToggleExpand}
        className="p-4 cursor-pointer"
      >
        {/* Priority badge and expand button */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority as keyof typeof priorityColors]}`}
          >
            {task.priority}
          </span>
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-brand-accent" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-brand-accent" />
            )}
          </div>
        </div>

        {/* Task title */}
        <h4 className="text-white font-medium mb-2 group-hover:text-brand-accent transition-colors">
          {task.title}
        </h4>

        {/* Task description preview */}
        {!isExpanded && task.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Assigned to */}
        {task.assignedTo && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-accent/10">
            {task.assignedTo.imageUrl ? (
              <img
                src={task.assignedTo.imageUrl}
                alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-accent/30 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-accent" />
              </div>
            )}
            <span className="text-xs text-gray-400">
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-brand-accent/10 pt-4 animate-in slide-in-from-top-2 duration-200">
          {/* Full description */}
          {task.description && (
            <div>
              <h5 className="text-xs font-semibold text-brand-accent uppercase mb-2">Description</h5>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Status and Priority selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-accent/40 disabled:opacity-50"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={isUpdatingPriority}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-accent/40 disabled:opacity-50"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-brand-accent" />
              <h5 className="text-xs font-semibold text-brand-accent uppercase">
                Comments ({task.comments?.length || 0})
              </h5>
            </div>

            {/* Comment list */}
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-brand-accent/10">
                    <div className="flex items-center gap-2 mb-2">
                      {comment.user.imageUrl ? (
                        <img
                          src={comment.user.imageUrl}
                          alt={`${comment.user.firstName} ${comment.user.lastName}`}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-brand-accent/30 flex items-center justify-center">
                          <User className="w-3 h-3 text-brand-accent" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-white">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 min-w-0 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-accent/40"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="flex-shrink-0 min-w-[80px] px-4 py-2 bg-brand-accent hover:bg-brand-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
              >
                {isSubmittingComment ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
