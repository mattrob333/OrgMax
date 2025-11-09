'use client'

import { ReactNode, useRef, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels'
import { useAppStore } from '@/lib/store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WorkspaceShellProps {
  leftNav: ReactNode
  mainContent: ReactNode
  rightPanel?: ReactNode
}

export function WorkspaceShell({ leftNav, mainContent, rightPanel }: WorkspaceShellProps) {
  const { workspaceLayout, setWorkspaceLayout } = useAppStore()
  const leftPanelRef = useRef<ImperativePanelHandle>(null)

  const toggleLeftSidebar = () => {
    const newCollapsedState = !workspaceLayout.leftSidebarCollapsed
    setWorkspaceLayout({ leftSidebarCollapsed: newCollapsedState })

    // Use imperative API to collapse/expand
    if (leftPanelRef.current) {
      if (newCollapsedState) {
        leftPanelRef.current.collapse()
      } else {
        leftPanelRef.current.expand()
      }
    }
  }

  const toggleRightPanel = () => {
    setWorkspaceLayout({ rightPanelCollapsed: !workspaceLayout.rightPanelCollapsed })
  }

  // Sync initial collapsed state on mount
  useEffect(() => {
    if (leftPanelRef.current && workspaceLayout.leftSidebarCollapsed) {
      leftPanelRef.current.collapse()
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Navigation Sidebar */}
        <Panel
          ref={leftPanelRef}
          id="left-sidebar"
          defaultSize={16}
          minSize={12}
          maxSize={30}
          collapsible={true}
          collapsedSize={0}
          className={workspaceLayout.leftSidebarCollapsed ? '' : 'bg-gray-900/50 border-r border-purple-500/20'}
        >
          {!workspaceLayout.leftSidebarCollapsed && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {leftNav}
              </div>
              <button
                onClick={toggleLeftSidebar}
                className="p-2 border-t border-purple-500/20 hover:bg-purple-500/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-purple-300" />
              </button>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="w-1 bg-purple-500/20 hover:bg-purple-500/40 transition-colors cursor-col-resize">
          <div className="h-full w-full" />
        </PanelResizeHandle>

        {/* Main Content Area */}
        <Panel id="main-content">
          <div className="h-full flex flex-col relative">
            {workspaceLayout.leftSidebarCollapsed && (
              <button
                onClick={toggleLeftSidebar}
                className="absolute top-2 left-2 p-2 bg-gray-800 rounded-lg hover:bg-purple-500/20 transition-colors z-10"
              >
                <ChevronRight className="w-4 h-4 text-purple-300" />
              </button>
            )}
            {workspaceLayout.rightPanelCollapsed && rightPanel && (
              <button
                onClick={toggleRightPanel}
                className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg hover:bg-purple-500/20 transition-colors z-10"
              >
                <ChevronLeft className="w-4 h-4 text-purple-300" />
              </button>
            )}
            {mainContent}
          </div>
        </Panel>

        {/* Right Copilot Panel (Future) */}
        {rightPanel && !workspaceLayout.rightPanelCollapsed && (
          <>
            <PanelResizeHandle className="w-1 bg-purple-500/20 hover:bg-purple-500/40 transition-colors cursor-col-resize">
              <div className="h-full w-full" />
            </PanelResizeHandle>
            <Panel
              defaultSize={25}
              minSize={20}
              maxSize={40}
              className="bg-gray-900/50 border-l border-purple-500/20"
            >
              <div className="h-full flex flex-col">
                <button
                  onClick={toggleRightPanel}
                  className="p-2 border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-purple-300" />
                </button>
                <div className="flex-1 overflow-y-auto">
                  {rightPanel}
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  )
}
