'use client'

import { useState } from 'react'
import { X, Search, Crown } from 'lucide-react'
import Image from 'next/image'
import { ExtendedUser } from '@/types'
import { getInitials } from '@/lib/utils'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  employeeToConnect: ExtendedUser
  availableManagers: ExtendedUser[]
  onConnect: (managerId: string) => Promise<void>
}

export function ConnectionModal({
  isOpen,
  onClose,
  employeeToConnect,
  availableManagers,
  onConnect
}: ConnectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  if (!isOpen) return null

  const filteredManagers = availableManagers.filter(manager => 
    manager.id !== employeeToConnect.id && // Can't be own manager
    `${manager.firstName} ${manager.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleConnect = async (managerId: string) => {
    setIsConnecting(true)
    try {
      await onConnect(managerId)
      onClose()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Connect Employee to Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Employee to connect */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-orange-500/30">
          <p className="text-sm text-gray-400 mb-2">Connecting:</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden">
              {employeeToConnect.imageUrl ? (
                <Image
                  src={employeeToConnect.imageUrl}
                  alt={`${employeeToConnect.firstName} ${employeeToConnect.lastName}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white font-semibold text-sm">
                  {getInitials(employeeToConnect.firstName || undefined, employeeToConnect.lastName || undefined)}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {employeeToConnect.firstName} {employeeToConnect.lastName}
              </p>
              <p className="text-gray-400 text-sm">{employeeToConnect.title}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search for manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Manager list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredManagers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              {searchTerm ? 'No managers found matching your search.' : 'No available managers.'}
            </p>
          ) : (
            filteredManagers.map((manager) => (
              <button
                key={manager.id}
                onClick={() => handleConnect(manager.id)}
                disabled={isConnecting}
                className="w-full p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {manager.imageUrl ? (
                      <Image
                        src={manager.imageUrl}
                        alt={`${manager.firstName} ${manager.lastName}`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white font-semibold text-sm">
                        {getInitials(manager.firstName || undefined, manager.lastName || undefined)}
                      </div>
                    )}
                    {manager.role === 'ADMIN' && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">
                      {manager.firstName} {manager.lastName}
                      {manager.role === 'ADMIN' && (
                        <span className="ml-2 text-yellow-400 text-xs">ADMIN</span>
                      )}
                    </p>
                    <p className="text-gray-400 text-sm">{manager.title}</p>
                    {manager.department && (
                      <p className="text-gray-500 text-xs">{manager.department}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Make explicit root node option */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => handleConnect('ROOT')}
            disabled={isConnecting}
            className="w-full p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-green-400 font-medium">Make Root Node</p>
            <p className="text-green-300/70 text-sm">Set as explicit organizational root (no manager needed)</p>
          </button>
        </div>

        {isConnecting && (
          <div className="mt-4 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Connecting...</span>
          </div>
        )}
      </div>
    </div>
  )
}