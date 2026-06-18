import React, { useState } from 'react'
import { useProjectStore, createProjectObject, type NewProjectInput } from './store/projectStore'
import { projectFileHandles } from './store/projectStore'
import { openProject } from './lib/browserAPI'
import { Toolbar } from './components/toolbar/Toolbar'
import { ProjectSidebar } from './components/ProjectSidebar'
import { BowtieCanvas } from './components/BowtieCanvas'
import { TitleBlock } from './components/TitleBlock'
import { NodeEditPanel } from './components/panels/NodeEditPanel'
import { NewProjectModal } from './components/NewProjectModal'
import { ProjectSettingsView, BowtieSettingsView } from './components/SettingsView'
import { HazidImportModal } from './components/HazidImportModal'
import { ActionsModal } from './components/ActionsModal'

export default function App(): React.ReactElement {
  const store = useProjectStore()
  const activeView = useProjectStore((s) => s.activeView)
  const actionsTarget = useProjectStore((s) => s.actionsTarget)
  const [showNewProject, setShowNewProject] = useState(false)
  const [hazidImport, setHazidImport] = useState<{
    projectId: string
    attachment: { name: string; dataBase64: string }
  } | null>(null)

  const handleCreate = (input: NewProjectInput): void => {
    store.addProject(createProjectObject(input))
    setShowNewProject(false)
  }

  const handleOpenProject = async (): Promise<void> => {
    const result = await openProject()
    if (result.success && result.data) {
      try {
        const project = JSON.parse(result.data)
        store.loadProject(project)
        if (result.handle) projectFileHandles.set(project.id, result.handle)
      } catch {
        alert('Could not read that project file.')
      }
    }
  }

  const renderMain = (): React.ReactElement => {
    if (activeView.kind === 'projectSettings') {
      return <ProjectSettingsView projectId={activeView.projectId} />
    }
    if (activeView.kind === 'bowtieSettings') {
      return <BowtieSettingsView projectId={activeView.projectId} bowtieId={activeView.bowtieId} />
    }
    if (activeView.kind === 'bowtie') {
      const project = store.getProject(activeView.projectId)
      const bowtie = project?.bowties.find((b) => b.id === activeView.bowtieId)
      if (project && bowtie) {
        return (
          <div className="flex flex-1 min-w-0">
            <div className="flex flex-col flex-1 min-w-0">
              <BowtieCanvas project={project} bowtie={bowtie} />
              <TitleBlock project={project} bowtie={bowtie} />
            </div>
            <NodeEditPanel />
          </div>
        )
      }
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white text-center gap-5">
        <div className="text-2xl font-bold text-gray-800">Bowtie Builder</div>
        <div className="text-sm text-gray-500">Create a new facility project or open an existing one.</div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewProject(true)}
            className="px-5 py-2 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            New Project
          </button>
          <button
            onClick={handleOpenProject}
            className="px-5 py-2 rounded border border-gray-300 text-gray-600 text-sm hover:bg-gray-100"
          >
            Open Project
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      <Toolbar onNewProject={() => setShowNewProject(true)} onOpenProject={handleOpenProject} />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          onNewProject={() => setShowNewProject(true)}
          onOpenProject={handleOpenProject}
          onImportHazid={(projectId, attachment) => setHazidImport({ projectId, attachment })}
        />
        {renderMain()}
      </div>
      {showNewProject && (
        <NewProjectModal onCreate={handleCreate} onCancel={() => setShowNewProject(false)} />
      )}
      {hazidImport && (
        <HazidImportModal
          projectId={hazidImport.projectId}
          attachment={hazidImport.attachment}
          onClose={() => setHazidImport(null)}
        />
      )}
      {actionsTarget && activeView.kind === 'bowtie' && (
        <ActionsModal
          projectId={activeView.projectId}
          target={actionsTarget}
          onClose={() => store.setActionsTarget(null)}
        />
      )}
    </div>
  )
}
