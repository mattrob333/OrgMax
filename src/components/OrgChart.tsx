'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { EmployeeNode } from './EmployeeNode'
import { ConnectionModal } from './ConnectionModal'
import { EditEmployeeModal } from './EditEmployeeModal'
import { DocumentUploadModal } from './DocumentUploadModal'
import { generateOrgChartData, AdminStatus } from '@/lib/orgchart'
import { ExtendedUser, NodeData } from '@/types'
import { useAppStore } from '@/lib/store'

const nodeTypes = {
  employeeNode: EmployeeNode,
}

interface OrgChartProps {
  employees: ExtendedUser[]
  adminStatus?: AdminStatus
  currentUser?: ExtendedUser
  onCalendarClick?: (user: ExtendedUser) => void
  onRefresh?: () => Promise<void>
}

export function OrgChart({ employees, adminStatus, currentUser, onCalendarClick, onRefresh }: OrgChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [chattedEmployeeIds, setChattedEmployeeIds] = useState<string[]>([])
  const [connectionModal, setConnectionModal] = useState<{
    isOpen: boolean
    employee: ExtendedUser | null
  }>({ isOpen: false, employee: null })
  
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    employee: ExtendedUser | null
  }>({ isOpen: false, employee: null })
  
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean
    employee: ExtendedUser | null
  }>({ isOpen: false, employee: null })
  
  const [employeeDocuments, setEmployeeDocuments] = useState<Record<string, boolean>>({})

  const setChatHistoryId = useAppStore(state => state.setChatHistoryId)
  const setIsChatHistoryModalOpen = useAppStore(state => state.setIsChatHistoryModalOpen)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleConnectClick = useCallback((user: ExtendedUser) => {
    setConnectionModal({ isOpen: true, employee: user })
  }, [])

  const handleEditClick = useCallback((user: ExtendedUser) => {
    setEditModal({ isOpen: true, employee: user })
  }, [])

  const handleDocumentUpload = useCallback((user: ExtendedUser) => {
    setDocumentModal({ isOpen: true, employee: user })
  }, [])

  const handleChatHistoryClick = useCallback(async (user: ExtendedUser) => {
    // Find the most recent chat with this employee
    try {
      const response = await fetch('/api/chat/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: user.id
        })
      })

      if (response.ok) {
        const chatData = await response.json()
        if (chatData.chatId) {
          setChatHistoryId(chatData.chatId)
          setIsChatHistoryModalOpen(true)
        }
      }
    } catch (error) {
      console.error('Error opening chat history:', error)
    }
  }, [setChatHistoryId, setIsChatHistoryModalOpen])

  const handleConnectionModalClose = useCallback(() => {
    setConnectionModal({ isOpen: false, employee: null })
  }, [])

  const handleEditModalClose = useCallback(() => {
    setEditModal({ isOpen: false, employee: null })
  }, [])

  const handleDocumentModalClose = useCallback(() => {
    setDocumentModal({ isOpen: false, employee: null })
  }, [])

  const handleEmployeeUpdate = useCallback(async (userData: Partial<ExtendedUser>) => {
    if (!editModal.employee) return

    try {
      const response = await fetch('/api/admin/update-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editModal.employee.id,
          ...userData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update employee')
      }

      // Refresh the org chart with smooth transition
      if (onRefresh) {
        await onRefresh()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Employee update error:', error)
      throw error // Re-throw to let the modal handle the error display
    }
  }, [editModal.employee, onRefresh])

  const handleManagerConnection = useCallback(async (managerId: string) => {
    if (!connectionModal.employee) return

    try {
      const response = await fetch('/api/admin/connect-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: connectionModal.employee.id,
          managerId: managerId || null, // Empty string becomes null for root nodes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update connection')
      }

      // Refresh the org chart with smooth transition
      if (onRefresh) {
        await onRefresh()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert('Failed to update connection. Please try again.')
    }
  }, [connectionModal.employee, onRefresh])

  // Fetch chat availability and document data when current user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return

      try {
        // Fetch chat availability
        const chatResponse = await fetch('/api/chat/availability')
        if (chatResponse.ok) {
          const data = await chatResponse.json()
          setChattedEmployeeIds(data.chattedEmployees.map((emp: any) => emp.employeeId))
        }

        // Fetch document status for all employees (admin only)
        if (currentUser.role === 'ADMIN') {
          const docs: Record<string, boolean> = {}
          for (const emp of employees) {
            if (emp.employeeId) {
              try {
                const docResponse = await fetch(`/api/admin/upload-document?employeeId=${emp.employeeId}`)
                if (docResponse.ok) {
                  const docData = await docResponse.json()
                  docs[emp.employeeId] = docData.hasDocument
                }
              } catch (err) {
                console.error(`Error fetching document for ${emp.employeeId}:`, err)
              }
            }
          }
          setEmployeeDocuments(docs)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [currentUser, employees])

  // Generate chart data when employees, adminStatus, or chat data change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateOrgChartData(employees, adminStatus, currentUser, onCalendarClick, handleConnectClick, handleEditClick, handleChatHistoryClick, onRefresh, chattedEmployeeIds, handleDocumentUpload, employeeDocuments)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [employees, adminStatus, currentUser, onCalendarClick, handleConnectClick, handleEditClick, handleChatHistoryClick, onRefresh, chattedEmployeeIds, handleDocumentUpload, employeeDocuments, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.4,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.5}
        maxZoom={2}
        className="bg-gradient-to-br from-slate-900 to-slate-800"
      >
        <Controls 
          className="react-flow__controls orb-glow"
          showInteractive={false}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#8b5cf6"
          className="opacity-20"
        />
      </ReactFlow>
      
      <ConnectionModal
        isOpen={connectionModal.isOpen}
        onClose={handleConnectionModalClose}
        employeeToConnect={connectionModal.employee!}
        availableManagers={employees}
        onConnect={handleManagerConnection}
      />
      
      {editModal.employee && (
        <EditEmployeeModal
          user={editModal.employee}
          isOpen={editModal.isOpen}
          onClose={handleEditModalClose}
          onSave={handleEmployeeUpdate}
        />
      )}
      
      {documentModal.isOpen && documentModal.employee && (
        <DocumentUploadModal
          employee={documentModal.employee}
          onClose={handleDocumentModalClose}
          onUploadSuccess={async () => {
            // Refresh document status
            if (documentModal.employee?.employeeId) {
              try {
                const response = await fetch(`/api/admin/upload-document?employeeId=${documentModal.employee.employeeId}`)
                if (response.ok) {
                  const data = await response.json()
                  setEmployeeDocuments(prev => ({
                    ...prev,
                    [documentModal.employee!.employeeId!]: data.hasDocument
                  }))
                }
              } catch (error) {
                console.error('Error refreshing document status:', error)
              }
            }
          }}
        />
      )}
    </div>
  )
} 