'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText } from 'lucide-react'

interface DocumentUploadModalProps {
  onClose: () => void
  onUploadSuccess: () => void
}

export function DocumentUploadModal({ onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [scope, setScope] = useState<'PERSONAL' | 'TEAM' | 'COMPANY'>('PERSONAL')
  const [category, setCategory] = useState('')
  const [analyzeOnUpload, setAnalyzeOnUpload] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ['.txt', '.md', '.pdf', '.doc', '.docx']
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext))

    if (!isValidType) {
      alert('Please select a .txt, .md, .pdf, .doc, or .docx file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Read file content
      const content = await readFileContent(file)

      // Determine file type
      const fileType = getFileType(fileName)

      // Prepare upload data
      const uploadData = {
        fileName: file.name,
        fileType,
        content,
        scope,
        category: category || undefined,
        analyzeOnUpload,
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      })

      if (response.ok) {
        onUploadSuccess()
        onClose()
      } else {
        const error = await response.text()
        alert(`Upload failed: ${error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const getFileType = (fileName: string): string => {
    if (fileName.endsWith('.txt')) return 'text/plain'
    if (fileName.endsWith('.md')) return 'text/markdown'
    if (fileName.endsWith('.pdf')) return 'application/pdf'
    if (fileName.endsWith('.doc')) return 'application/msword'
    if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return 'text/plain'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-500/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="document-library-upload"
            />
            <label
              htmlFor="document-library-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-300 text-center">
                Click to select a document
              </p>
              <p className="text-xs text-gray-500">
                Supports .txt, .md, .pdf, .doc, .docx (max 5MB)
              </p>
            </label>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
            >
              <option value="PERSONAL">Personal (only you can see)</option>
              <option value="TEAM">Team (your department can see)</option>
              <option value="COMPANY">Company (everyone can see)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isUploading}
              placeholder="e.g., Meeting Notes, Reports, SOPs"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          {/* AI Analysis Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="analyze-upload"
              checked={analyzeOnUpload}
              onChange={(e) => setAnalyzeOnUpload(e.target.checked)}
              disabled={isUploading}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="analyze-upload" className="flex-1 text-sm text-gray-300">
              Analyze document with AI on upload
            </label>
          </div>

          {/* Upload Status */}
          {isUploading && (
            <div className="flex items-center justify-center gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="w-5 h-5 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-purple-300">Uploading...</span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            <strong>Tip:</strong> Uploaded documents can be attached to the AI copilot for context-aware conversations.
          </p>
        </div>
      </div>
    </div>
  )
}
