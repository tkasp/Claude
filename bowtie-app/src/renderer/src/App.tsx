import React from 'react'
import { ProjectSidebar } from './components/ProjectSidebar'
import { Toolbar } from './components/toolbar/Toolbar'
import { BowtieCanvas } from './components/BowtieCanvas'
import { TitleBlock } from './components/TitleBlock'
import { NodeEditPanel } from './components/panels/NodeEditPanel'
import { useProjectStore } from './store/projectStore'

export default function App(): React.ReactElement {
  const activeBowtieId = useProjectStore((s) => s.activeBowtieId)

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden">
      <ProjectSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {activeBowtieId ? (
              <BowtieCanvas />
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-500 text-lg">
                Select or create a bowtie to get started
              </div>
            )}
            {activeBowtieId && <TitleBlock />}
          </div>
          <NodeEditPanel />
        </div>
      </div>
    </div>
  )
}
