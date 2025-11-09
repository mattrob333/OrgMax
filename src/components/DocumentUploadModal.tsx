'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { User } from '@/types'

interface DocumentUploadModalProps {
  employee: User | null
  onClose: () => void
  onUploadSuccess: () => void
}

export function DocumentUploadModal({ employee, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [existingDocument, setExistingDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing document on mount
  useState(() => {
    if (employee?.employeeId) {
      fetch(`/api/admin/upload-document?employeeId=${employee.employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.hasDocument) {
            setExistingDocument(data.document)
          }
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch document:', err)
          setIsLoading(false)
        })
    }
  }, [employee])

  if (!employee) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.md')) {
      alert('Please select a .txt or .md file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('employeeId', employee.employeeId!)

      const response = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setExistingDocument({
          fileName: data.fileName,
          fileType: fileName.endsWith('.txt') ? 'txt' : 'md',
          createdAt: new Date().toISOString(),
        })
        onUploadSuccess()
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/upload-document?employeeId=${employee.employeeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExistingDocument(null)
        onUploadSuccess()
      } else {
        const error = await response.text()
        alert(`Delete failed: ${error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-500/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Document Upload
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300">
            Employee: <span className="font-semibold text-white">
              {employee.firstName} {employee.lastName}
            </span>
          </p>
          {employee.title && (
            <p className="text-sm text-gray-400 mt-1">{employee.title}</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : existingDocument ? (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <p className="text-white font-medium">{existingDocument.fileName}</p>
                  <p className="text-sm text-gray-400">
                    Uploaded: {new Date(existingDocument.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                title="Delete document"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="document-upload"
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-300 text-center">
                {existingDocument ? 'Replace document' : 'Upload document'}
              </p>
              <p className="text-xs text-gray-500">
                Supports .txt and .md files (max 5MB)
              </p>
            </label>
          </div>

          {isUploading && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Documents will be used as context when chatting with this employee's AI assistant.
          </p>
        </div>
      </div>
    </div>
  )
}