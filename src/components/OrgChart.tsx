'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  NodeChange,
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
import { Lock, Unlock, Save, RotateCcw } from 'lucide-react'

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
  const manualNodePositions = useAppStore(state => state.manualNodePositions)
  const layoutHasUnsavedChanges = useAppStore(state => state.layoutHasUnsavedChanges)
  const isLayoutLocked = useAppStore(state => state.isLayoutLocked)
  const updateManualNodePosition = useAppStore(state => state.updateManualNodePosition)
  const persistManualNodePositions = useAppStore(state => state.persistManualNodePositions)
  const clearManualNodePositions = useAppStore(state => state.clearManualNodePositions)
  const loadManualNodePositions = useAppStore(state => state.loadManualNodePositions)
  const setIsLayoutLocked = useAppStore(state => state.setIsLayoutLocked)
  const setManualNodePositions = useAppStore(state => state.setManualNodePositions)

  const hasManualPositions = useMemo(
    () => Object.keys(manualNodePositions).length > 0,
    [manualNodePositions]
  )
  const canResetLayout = hasManualPositions || layoutHasUnsavedChanges

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

  useEffect(() => {
    loadManualNodePositions()
  }, [loadManualNodePositions])

  useEffect(() => {
    if (!hasManualPositions) return

    const validIds = new Set(employees.map(emp => emp.id))
    if (adminStatus?.adminUser && adminStatus.needsFloatingNode) {
      validIds.add(`admin-${adminStatus.adminUser.id}`)
    }

    const filteredEntries = Object.entries(manualNodePositions).filter(([id]) => validIds.has(id))
    if (filteredEntries.length !== Object.keys(manualNodePositions).length) {
      setManualNodePositions(Object.fromEntries(filteredEntries))
    }
  }, [employees, adminStatus, manualNodePositions, hasManualPositions, setManualNodePositions])

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
    const { nodes: newNodes, edges: newEdges } = generateOrgChartData(
      employees,
      adminStatus,
      currentUser,
      onCalendarClick,
      handleConnectClick,
      handleEditClick,
      handleChatHistoryClick,
      onRefresh,
      chattedEmployeeIds,
      handleDocumentUpload,
      employeeDocuments,
      manualNodePositions
    )
    setNodes(newNodes)
    setEdges(newEdges)
  }, [employees, adminStatus, currentUser, onCalendarClick, handleConnectClick, handleEditClick, handleChatHistoryClick, onRefresh, chattedEmployeeIds, handleDocumentUpload, employeeDocuments, manualNodePositions, setNodes, setEdges])

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)

    if (isLayoutLocked) return

    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateManualNodePosition(change.id, change.position)
      }
    })
  }, [onNodesChange, isLayoutLocked, updateManualNodePosition])

  const handleNodeDragStop = useCallback((_: unknown, node: Node<NodeData>) => {
    if (isLayoutLocked) return
    updateManualNodePosition(node.id, node.position)
  }, [isLayoutLocked, updateManualNodePosition])

  const handleToggleLock = useCallback(() => {
    setIsLayoutLocked(!isLayoutLocked)
  }, [isLayoutLocked, setIsLayoutLocked])

  const handleSaveLayout = useCallback(() => {
    persistManualNodePositions()
  }, [persistManualNodePositions])

  const handleResetLayout = useCallback(() => {
    clearManualNodePositions()
  }, [clearManualNodePositions])

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleLock}
            className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-gray-900/80 px-3 py-1.5 text-xs font-medium text-purple-100 transition hover:bg-purple-500/20"
          >
            {isLayoutLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isLayoutLocked ? 'Unlock Layout' : 'Lock Layout'}
          </button>
          <button
            onClick={handleSaveLayout}
            disabled={!layoutHasUnsavedChanges}
            className={`flex items-center gap-1 rounded-md border border-emerald-500/30 px-3 py-1.5 text-xs font-medium transition ${layoutHasUnsavedChanges ? 'bg-emerald-600/20 text-emerald-100 hover:bg-emerald-500/30' : 'cursor-not-allowed bg-emerald-600/10 text-emerald-200/50'}`}
          >
            <Save className="w-4 h-4" />
            Save Layout
          </button>
          <button
            onClick={handleResetLayout}
            disabled={!canResetLayout}
            className={`flex items-center gap-1 rounded-md border border-slate-500/30 px-3 py-1.5 text-xs font-medium transition ${canResetLayout ? 'bg-slate-900/80 text-slate-100 hover:bg-slate-800/80' : 'cursor-not-allowed bg-slate-900/40 text-slate-300/40'}`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Layout
          </button>
        </div>
        {!isLayoutLocked && (
          <div className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-xs text-purple-100">
            Layout editing unlocked
          </div>
        )}
        {layoutHasUnsavedChanges && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-100">
            Unsaved layout changes
          </div>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        nodesDraggable={!isLayoutLocked}
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