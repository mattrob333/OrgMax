'use client'

import { useState } from 'react'
import { FileText, Sparkles, Trash2, Eye, MoreVertical, GripVertical } from 'lucide-react'

interface Document {
  id: string
  fileName: string
  fileType: string
  scope: 'PERSONAL' | 'TEAM' | 'COMPANY'
  category?: string
  summary?: string
  createdAt: string
  updatedAt: string
}

interface DocumentCardProps {
  document: Document
  onAnalyze: (documentId: string) => void
  onDelete: (documentId: string) => void
}

const SCOPE_COLORS = {
  PERSONAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TEAM: 'bg-green-500/20 text-green-400 border-green-500/30',
  COMPANY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const FILE_TYPE_ICONS: Record<string, string> = {
  'text/plain': '📄',
  'text/markdown': '📝',
  'application/pdf': '📕',
  'default': '📄',
}

export function DocumentCard({ document, onAnalyze, onDelete }: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'document',
      documentId: document.id,
      fileName: document.fileName,
      content: document.summary || '',
    }))
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getFileIcon = () => {
    return FILE_TYPE_ICONS[document.fileType] || FILE_TYPE_ICONS.default
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative bg-gray-800 rounded-lg border border-gray-700
        hover:border-purple-500/50 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'cursor-move'}
      `}
    >
      {/* Drag handle indicator */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate" title={document.fileName}>
                {document.fileName}
              </h3>
              <p className="text-xs text-gray-400">
                {formatDate(document.updatedAt)}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-white rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20">
                  <button
                    onClick={() => {
                      onAnalyze(document.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2 rounded-t-lg"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Analyze with AI
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Open preview modal
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      onDelete(document.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2 rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {document.summary && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {document.summary}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 text-xs rounded border ${SCOPE_COLORS[document.scope]}`}>
            {document.scope}
          </span>
          {document.category && (
            <span className="px-2 py-1 text-xs rounded border bg-gray-700/50 text-gray-300 border-gray-600">
              {document.category}
            </span>
          )}
        </div>

        {/* Drag hint */}
        <div className="mt-3 pt-3 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-500 text-center">
            Drag to copilot to attach
          </p>
        </div>
      </div>
    </div>
  )
}
