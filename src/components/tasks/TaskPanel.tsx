'use client'

import { useEffect, useState } from 'react'
import { TaskCard } from './TaskCard'
import { TaskCreateModal } from './TaskCreateModal'
import { Plus } from 'lucide-react'

const COLUMNS = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'DONE', label: 'Done' },
] as const

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
}

export function TaskPanel({ userId, embedded = false }: { userId?: string, embedded?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filter, setFilter] = useState(userId ? 'assigned' : 'my') // 'my' | 'assigned' | 'created' | 'all'
  const [loading, setLoading] = useState(true)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [filter, userId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('filter', filter)
      if (userId) {
        queryParams.append('assignedTo', userId)
      }
      
      const res = await fetch(`/api/tasks?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleColumnDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    try {
      const data = e.dataTransfer.getData('application/json')
      const task = JSON.parse(data)

      if (task && task.id && task.status !== columnId) {
        // Update task status via API
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: columnId }),
        })

        if (res.ok) {
          fetchTasks() // Refresh tasks
        }
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const columnId = e.currentTarget.getAttribute('data-column-id')
    if (columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column container itself, not its children
    if (e.currentTarget === e.target) {
      setDragOverColumn(null)
    }
  }

  const groupedTasks = COLUMNS.map(column => ({
    ...column,
    tasks: tasks.filter(t => t.status === column.id),
  }))

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {!embedded && (
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
          <h2 className="text-2xl font-semibold text-white">Tasks</h2>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-white/10 focus:outline-none focus:border-brand-accent/40"
            >
              <option value="my">My Tasks</option>
              <option value="assigned">Assigned to Me</option>
              <option value="created">Created by Me</option>
              <option value="all">All Tasks</option>
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4 bg-transparent">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-brand-accent">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {groupedTasks.map(column => (
              <div
                key={column.id}
                data-column-id={column.id}
                onDrop={(e) => handleColumnDrop(e, column.id)}
                onDragOver={handleColumnDragOver}
                onDragLeave={handleColumnDragLeave}
                className={`flex-shrink-0 w-80 bg-[#1a1a1a] rounded-lg border flex flex-col transition-all ${
                  dragOverColumn === column.id
                    ? 'border-brand-accent bg-[var(--orb-purple)]/10 shadow-lg shadow-[var(--orb-glow)]'
                    : 'border-white/10'
                }`}
              >
                {/* Column header */}
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold text-white">{column.label}</h3>
                  <p className="text-sm text-gray-400">{column.tasks.length} tasks</p>
                </div>

                {/* Column content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No tasks in {column.label.toLowerCase()}
                    </div>
                  ) : (
                    column.tasks.map(task => (
                      <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchTasks}
      />
    </div>
  )
}
