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
    <div className="h-full min-h-0 flex flex-col">
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left Navigation Sidebar */}
        <Panel
          ref={leftPanelRef}
          id="left-sidebar"
          defaultSize={10}
          minSize={8}
          maxSize={30}
          collapsible={true}
          collapsedSize={0}
          className={workspaceLayout.leftSidebarCollapsed ? '' : 'bg-[#0f0f0f]/90 border-r border-white/12'}
        >
          {!workspaceLayout.leftSidebarCollapsed && (
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto">
                {leftNav}
              </div>
              <button
                onClick={toggleLeftSidebar}
                className="p-2 border-t border-white/12 hover:bg-[var(--orb-purple)]/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-brand-accent" />
              </button>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-white/10 hover:bg-brand-accent/40 transition-colors cursor-col-resize">
          <div className="h-full w-full" />
        </PanelResizeHandle>

        {/* Main Content Area */}
        <Panel id="main-content">
          <div className="h-full min-h-0 flex flex-col relative">
            {workspaceLayout.leftSidebarCollapsed && (
              <button
                onClick={toggleLeftSidebar}
                className="absolute top-2 left-2 p-2 bg-[#1a1a1a] rounded-lg hover:bg-[var(--orb-purple)]/20 transition-colors z-10"
              >
                <ChevronRight className="w-4 h-4 text-brand-accent" />
              </button>
            )}
            {workspaceLayout.rightPanelCollapsed && rightPanel && (
              <button
                onClick={toggleRightPanel}
                className="absolute top-2 right-2 p-2 bg-[#1a1a1a] rounded-lg hover:bg-[var(--orb-purple)]/20 transition-colors z-10"
              >
                <ChevronLeft className="w-4 h-4 text-brand-accent" />
              </button>
            )}
            {mainContent}
          </div>
        </Panel>

        {/* Right Copilot Panel (Future) */}
        {rightPanel && !workspaceLayout.rightPanelCollapsed && (
          <>
            <PanelResizeHandle className="w-[1px] bg-white/10 hover:bg-brand-accent/40 transition-colors cursor-col-resize">
              <div className="h-full w-full" />
            </PanelResizeHandle>
            <Panel
              defaultSize={25}
              minSize={20}
              maxSize={40}
              className="bg-[#0f0f0f]/90 border-l border-white/12"
            >
              <div className="h-full min-h-0 flex flex-col">
                <button
                  onClick={toggleRightPanel}
                  className="p-2 border-b border-white/12 hover:bg-[var(--orb-purple)]/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-brand-accent" />
                </button>
                <div className="flex-1 min-h-0">
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
