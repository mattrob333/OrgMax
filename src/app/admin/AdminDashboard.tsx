'use client'

import { useState, useRef } from 'react'
import { Upload, Users, FileText, CheckCircle, XCircle, Crown } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export function AdminDashboard() {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setStatusMessage('Please upload a CSV file.')
      return
    }

    setUploading(true)
    setUploadStatus('idle')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setUploadStatus('success')
        
        let message = `Successfully processed ${result.count} employees.`
        
        if (result.invitationsSent > 0) {
          message += ` Sent ${result.invitationsSent} email invitations.`
        }
        
        if (result.invitationErrors && result.invitationErrors.length > 0) {
          message += ` Warning: ${result.invitationErrors.length} invitation(s) failed to send.`
        }
        
        setStatusMessage(message)
        
        // Trigger a custom event to notify other parts of the app about the update
        window.dispatchEvent(new CustomEvent('employeeDataUpdated'))
      } else {
        const error = await response.text()
        setUploadStatus('error')
        setStatusMessage(error || 'Upload failed.')
      }
    } catch (error) {
      setUploadStatus('error')
      setStatusMessage('Network error occurred.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-full flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-4xl space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 gradient-orb rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/30 transition-transform hover:scale-105">
              <Crown className="text-white" size={32} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl blur opacity-20 animate-pulse"></div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-5xl font-thin tracking-tight text-white">Admin Dashboard</h1>
            <p className="text-xl font-light text-slate-300">Manage your organizational structure</p>
          </div>
          
          <div className="text-sm font-light text-slate-500 opacity-70">
            Blessed by the Orb of Ultimate Chaos 🟣
          </div>
        </div>

        {/* Upload Card */}
        <Card className="space-y-8">
          {/* Card Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Upload className="text-white" size={28} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-light text-white">Employee Data Upload</h2>
              <p className="text-lg font-light text-purple-200">Import your team structure via CSV</p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />

            {uploading ? (
              <div className="text-center py-16 space-y-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 gradient-orb rounded-3xl mx-auto flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-300 to-purple-500 rounded-2xl flex items-center justify-center animate-spin">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-30 animate-pulse"></div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-light text-white">Processing</h3>
                  <p className="text-lg text-slate-400 font-light">Analyzing your CSV file...</p>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-white/20 rounded-3xl p-16 text-center hover:border-purple-400/40 transition-all cursor-pointer group hover:bg-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-8">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded-3xl mx-auto flex items-center justify-center group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all group-hover:scale-105">
                      <FileText className="text-slate-400 group-hover:text-purple-400 transition-colors" size={40} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-light text-white">Drop your CSV file here</h3>
                    <p className="text-lg text-slate-400 font-light">or click to browse files</p>
                  </div>
                  
                  <button className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-medium transition-all hover:scale-105 shadow-xl shadow-purple-500/25">
                    <Upload size={20} />
                    <span className="text-lg">Choose File</span>
                  </button>
                  
                  <div className="pt-8 border-t border-white/10">
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 font-light">Expected format:</p>
                      <code className="inline-block text-sm text-purple-300 bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20 font-mono">
                        employeeId, firstName, lastName, email, title, department, managerId
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus !== 'idle' && (
              <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all ${
                uploadStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    uploadStatus === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {uploadStatus === 'success' ? (
                      <CheckCircle className="text-white" size={20} />
                    ) : (
                      <XCircle className="text-white" size={20} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`font-medium text-lg ${
                      uploadStatus === 'success' ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {uploadStatus === 'success' ? 'Upload Successful' : 'Upload Failed'}
                    </p>
                    <p className={`text-sm font-light ${
                      uploadStatus === 'success' ? 'text-emerald-400/80' : 'text-red-400/80'
                    }`}>
                      {statusMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Demo Data Card */}
        <Card className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <FileText className="text-white" size={24} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-light text-white">Need sample data?</h3>
            <p className="text-lg font-light text-slate-400">
              We&apos;ve created <code className="text-blue-300 bg-blue-500/10 px-2 py-1 rounded font-mono text-sm">demo_staff.csv</code> in your project root
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
} 