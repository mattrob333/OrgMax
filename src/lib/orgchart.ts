import { Node, Edge } from 'reactflow'
import { ExtendedUser, NodeData } from '@/types'

const nodeWidth = 320
const nodeHeight = 120
const horizontalGap = 40
const verticalGap = 100
const adminNodeGap = 60 // Gap between admin node and main chart

export interface AdminStatus {
  adminUser: ExtendedUser | null
  isInOrgChart: boolean
  needsFloatingNode: boolean
}

export function generateOrgChartData(employees: ExtendedUser[], adminStatus?: AdminStatus, currentUser?: ExtendedUser, onCalendarClick?: (user: ExtendedUser) => void, onConnectClick?: (user: ExtendedUser) => void, onEditClick?: (user: ExtendedUser) => void, onChatHistoryClick?: (user: ExtendedUser) => void, onRefresh?: () => Promise<void>, chattedEmployeeIds?: string[], onDocumentUpload?: (user: ExtendedUser) => void, employeeDocuments?: Record<string, boolean>): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = []
  const edges: Edge[] = []

  if (!employees || employees.length === 0) {
    return { nodes, edges }
  }

  // If admin is in the org chart, mark them as admin
  // If admin is NOT in org chart, we'll add them as a floating node
  let employeesToChart = employees
  let adminEmployee: ExtendedUser | null = null

  if (adminStatus?.adminUser) {
    if (adminStatus.isInOrgChart) {
      // Admin is in the employee data - mark them as admin
      employeesToChart = employees.map(emp => {
        if (emp.email.toLowerCase() === adminStatus.adminUser!.email.toLowerCase() ||
            emp.clerkId === adminStatus.adminUser!.clerkId) {
          return { ...emp, isAdmin: true, calendarConnected: adminStatus.adminUser!.calendarConnected, imageUrl: adminStatus.adminUser!.imageUrl }
        }
        return emp
      })
    } else {
      // Admin is NOT in employee data - we'll add them as floating node
      adminEmployee = { ...adminStatus.adminUser, isAdmin: true, imageUrl: adminStatus.adminUser.imageUrl }
    }
  }

  // Build hierarchy maps for regular employees
  const employeeMap = new Map(employeesToChart.map(emp => [emp.id, emp]))
  const childrenMap = new Map<string, ExtendedUser[]>()
  employeesToChart.forEach(emp => {
    if (emp.managerId && employeeMap.has(emp.managerId)) {
      const list = childrenMap.get(emp.managerId) ?? []
      list.push(emp)
      childrenMap.set(emp.managerId, list)
    }
  })

  // Identify roots (employees without a valid manager)
  const roots = employeesToChart.filter(emp => !emp.managerId || !employeeMap.has(emp.managerId))
  if (roots.length === 0 && employeesToChart.length > 0) {
    roots.push(employeesToChart[0]) // Fallback to first employee if no root found
  }

  // First Pass (Post-order traversal): Calculate the width of each subtree.
  const subtreeWidths = new Map<string, number>()
  function calculateSubtreeWidth(employeeId: string): number {
    const children = childrenMap.get(employeeId) || []
    if (children.length === 0) {
      subtreeWidths.set(employeeId, nodeWidth)
      return nodeWidth
    }

    const childrenWidth = children.reduce((total, child) => {
      return total + calculateSubtreeWidth(child.id)
    }, 0) + (children.length - 1) * horizontalGap

    const width = Math.max(nodeWidth, childrenWidth)
    subtreeWidths.set(employeeId, width)
    return width
  }

  roots.forEach(root => calculateSubtreeWidth(root.id))

  // Track CEO/top node position for admin placement
  let ceoX = 0
  let ceoY = 0

  // Second Pass (Pre-order traversal): Place nodes in their absolute positions.
  function assignPositions(employeeId: string, parentCenterX: number, y: number): void {
    const employee = employeeMap.get(employeeId)!
    const children = childrenMap.get(employeeId) || []
    
    // Track the first root (CEO) position
    if (y === 0 && ceoX === 0 && ceoY === 0) {
      ceoX = parentCenterX
      ceoY = y
    }
    
    // Place the current node, centered at the provided x.
    nodes.push(createNode(employee, parentCenterX - nodeWidth / 2, y, currentUser, onCalendarClick, onConnectClick, onEditClick, onChatHistoryClick, onRefresh, employeeMap, chattedEmployeeIds, onDocumentUpload, employeeDocuments))

    if (children.length > 0) {
      const childrenTotalWidth = children.reduce((total, child) => {
        return total + subtreeWidths.get(child.id)!
      }, 0) + (children.length - 1) * horizontalGap
      
      const childY = y + nodeHeight + verticalGap
      let childStartX = parentCenterX - childrenTotalWidth / 2

      children.forEach(child => {
        const childSubtreeWidth = subtreeWidths.get(child.id)!
        const childCenterX = childStartX + childSubtreeWidth / 2

        edges.push(createEdge(employeeId, child.id))
        assignPositions(child.id, childCenterX, childY)
        
        childStartX += childSubtreeWidth + horizontalGap
      })
    }
  }
  
  // Layout each root tree side-by-side.
  let currentRootX = 0
  roots.forEach(root => {
    const rootSubtreeWidth = subtreeWidths.get(root.id)!
    const rootCenterX = currentRootX + rootSubtreeWidth / 2
    assignPositions(root.id, rootCenterX, 0)
    currentRootX += rootSubtreeWidth + horizontalGap * 2
  })

  // Add floating admin node next to the CEO/top node
  if (adminEmployee) {
    // Position admin node next to the CEO at the same level
    const adminX = ceoX + nodeWidth + adminNodeGap
    const adminY = ceoY
    
    nodes.push(createAdminNode(adminEmployee, adminX, adminY, currentUser, onCalendarClick, onConnectClick, onEditClick, onChatHistoryClick, onRefresh, employeeMap, chattedEmployeeIds, onDocumentUpload, employeeDocuments))
  }

  return { nodes, edges }
}

function createNode(employee: ExtendedUser, x: number, y: number, currentUser?: ExtendedUser, onCalendarClick?: (user: ExtendedUser) => void, onConnectClick?: (user: ExtendedUser) => void, onEditClick?: (user: ExtendedUser) => void, onChatHistoryClick?: (user: ExtendedUser) => void, onRefresh?: () => Promise<void>, employeeMap?: Map<string, ExtendedUser>, chattedEmployeeIds?: string[], onDocumentUpload?: (user: ExtendedUser) => void, employeeDocuments?: Record<string, boolean>): Node<NodeData> {
  // Check if this employee is truly unconnected (unknown status, not explicit root)
  // - If isExplicitRoot is true, they are intended root nodes (not unconnected)
  // - If managerId exists and is valid, they are connected
  // - Otherwise, they are unconnected (unknown status)
  const isUnconnected = !employee.isExplicitRoot && (!employee.managerId || (employeeMap && !employeeMap.has(employee.managerId)))
  
  return {
    id: employee.id,
    type: 'employeeNode',
    position: { x, y },
    data: { 
      user: employee,
      isAdmin: (employee as any).isAdmin || false,
      isUnconnected,
      currentUserIsAdmin: currentUser?.role === 'ADMIN',
      currentUserId: currentUser?.id,
      hasChatHistory: chattedEmployeeIds?.includes(employee.id) || false,
      hasDocument: employee.employeeId ? employeeDocuments?.[employee.employeeId] || false : false,
      onCalendarClick,
      onConnectClick,
      onEditClick,
      onChatHistoryClick,
      onDocumentUpload,
      onRefresh
    },
  }
}

function createAdminNode(adminUser: ExtendedUser, x: number, y: number, currentUser?: ExtendedUser, onCalendarClick?: (user: ExtendedUser) => void, onConnectClick?: (user: ExtendedUser) => void, onEditClick?: (user: ExtendedUser) => void, onChatHistoryClick?: (user: ExtendedUser) => void, onRefresh?: () => Promise<void>, employeeMap?: Map<string, ExtendedUser>, chattedEmployeeIds?: string[], onDocumentUpload?: (user: ExtendedUser) => void, employeeDocuments?: Record<string, boolean>): Node<NodeData> {
  // Admin nodes are considered unconnected if they're floating and not explicit root
  const isUnconnected = !adminUser.isExplicitRoot && (!adminUser.managerId || (employeeMap && !employeeMap.has(adminUser.managerId)))
  
  return {
    id: `admin-${adminUser.id}`,
    type: 'employeeNode',
    position: { x, y },
    data: { 
      user: adminUser,
      isAdmin: true,
      isFloatingAdmin: true,
      isUnconnected,
      currentUserIsAdmin: currentUser?.role === 'ADMIN',
      currentUserId: currentUser?.id,
      hasChatHistory: chattedEmployeeIds?.includes(adminUser.id) || false,
      hasDocument: adminUser.employeeId ? employeeDocuments?.[adminUser.employeeId] || false : false,
      onCalendarClick,
      onConnectClick,
      onEditClick,
      onChatHistoryClick,
      onDocumentUpload,
      onRefresh
    },
  }
}

function createEdge(sourceId: string, targetId: string): Edge {
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    style: {
      stroke: '#8b5cf6',
      strokeWidth: 1.5,
    },
    animated: false,
  }
}