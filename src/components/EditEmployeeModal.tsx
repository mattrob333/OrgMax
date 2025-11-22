'use client'

import { useState, useEffect } from 'react'
import { X, Save, User, Bot, Globe, Briefcase, Building, MessageSquare } from 'lucide-react'
import { ExtendedUser, PersonalityType } from '@/types'

interface EditEmployeeModalProps {
  user: ExtendedUser
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<ExtendedUser>) => Promise<void>
}

// Common timezone options
const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

const PERSONALITY_TYPES: { value: PersonalityType; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-focused communication' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and personable' },
  { value: 'technical', label: 'Technical', description: 'Detail-oriented, precise, technical focus' },
  { value: 'creative', label: 'Creative', description: 'Innovative, imaginative, outside-the-box thinking' },
  { value: 'analytical', label: 'Analytical', description: 'Data-driven, logical, systematic approach' },
  { value: 'supportive', label: 'Supportive', description: 'Encouraging, helpful, team-oriented' },
  { value: 'direct', label: 'Direct', description: 'Straightforward, concise, no-nonsense' },
  { value: 'mentor', label: 'Mentor', description: 'Guiding, teaching, wisdom-sharing' },
]

export function EditEmployeeModal({ user, isOpen, onClose, onSave }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    title: user.title || '',
    department: user.department || '',
    customPrompt: user.customPrompt || '',
    personalityType: user.personalityType || 'professional' as PersonalityType,
    systemMessage: user.systemMessage || '',
    timezone: user.timezone || 'UTC',
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        title: user.title || '',
        department: user.department || '',
        customPrompt: user.customPrompt || '',
        personalityType: user.personalityType || 'professional',
        systemMessage: user.systemMessage || '',
        timezone: user.timezone || 'UTC',
      })
      setErrors({})
    }
  }, [user, isOpen])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (formData.customPrompt.length > 500) {
      newErrors.customPrompt = 'Custom prompt must be 500 characters or less'
    }
    if (formData.systemMessage.length > 1000) {
      newErrors.systemMessage = 'System message must be 1000 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving employee data:', error)
      setErrors({ general: 'Failed to save employee data. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden orb-glow flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-[#A8D622] p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <User className="text-white" size={24} />
            <h2 className="text-xl font-semibold text-white">
              Edit Employee: {user.firstName} {user.lastName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {errors.general}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-white flex items-center">
                <User className="text-brand-accent mr-2" size={18} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-neutral-600'
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-neutral-600'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-white flex items-center">
                <Briefcase className="text-brand-accent mr-2" size={18} />
                Work Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full bg-gray-700 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full bg-gray-700 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-white flex items-center">
                <Bot className="text-brand-accent mr-2" size={18} />
                AI Assistant Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Personality Type
                </label>
                <select
                  value={formData.personalityType}
                  onChange={(e) => handleInputChange('personalityType', e.target.value)}
                  className="w-full bg-gray-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                >
                  {PERSONALITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Message
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  Core behavioral instructions for the AI assistant (from CSV or direct input)
                </p>
                <textarea
                  value={formData.systemMessage}
                  onChange={(e) => handleInputChange('systemMessage', e.target.value)}
                  rows={2}
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-none ${
                    errors.systemMessage ? 'border-red-500' : 'border-neutral-600'
                  }`}
                  placeholder="e.g., You are a senior developer who specializes in React and TypeScript..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.systemMessage && (
                    <p className="text-red-400 text-xs">{errors.systemMessage}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.systemMessage.length}/1000 characters
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Prompt
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  Additional personal instructions and preferences
                </p>
                <textarea
                  value={formData.customPrompt}
                  onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                  rows={3}
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-none ${
                    errors.customPrompt ? 'border-red-500' : 'border-neutral-600'
                  }`}
                  placeholder="e.g., I prefer informal communication, I'm available for quick questions during business hours..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.customPrompt && (
                    <p className="text-red-400 text-xs">{errors.customPrompt}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.customPrompt.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-3">
              <h3 className="text-md font-medium text-white flex items-center">
                <Globe className="text-brand-accent mr-2" size={18} />
                Timezone Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <p className="text-sm text-gray-400 mb-2">
                  Used for calendar events and scheduling
                </p>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full bg-gray-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 p-4 border-t border-neutral-700 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 border border-neutral-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-[#A8D622] hover:from-blue-700 hover:to-brand-accent disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-all orb-glow flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}