'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, FileText, Loader2 } from 'lucide-react'
import { DocumentCard } from './DocumentCard'
import { DocumentUploadModal } from './DocumentUploadModal'

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

export function DocumentLibrary({ userId, embedded = false }: { userId?: string, embedded?: boolean }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'PERSONAL' | 'TEAM' | 'COMPANY'>('ALL')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Load documents
  useEffect(() => {
    loadDocuments()
  }, [scopeFilter, userId])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (scopeFilter !== 'ALL') {
        params.append('scope', scopeFilter)
      }
      if (userId) {
        // This assumes the API supports filtering by userId. 
        // If not, it will be ignored or we might need to update the API.
        params.append('userId', userId) 
      }

      const response = await fetch(`/api/documents?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load documents')

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentAnalyze = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'full' }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      console.log('Analysis result:', data)

      // TODO: Show analysis modal
      alert(`Analysis complete!\nAction Items: ${data.actionItems?.length || 0}`)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze document')
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Delete failed')

      // Reload documents
      loadDocuments()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
  }

  // Filter documents by search query
  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      {!embedded && (
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Document Library</h2>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Upload
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-accent"
              />
            </div>

            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-accent"
            >
              <option value="ALL">All Documents</option>
              <option value="PERSONAL">Personal</option>
              <option value="TEAM">Team</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>
        </div>
      )}

      {/* Document Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Upload documents to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Upload Your First Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onAnalyze={handleDocumentAnalyze}
                onDelete={handleDocumentDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={loadDocuments}
        />
      )}
    </div>
  )
}
