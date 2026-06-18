import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { captureActiveBowtie } from '../../lib/exportRegistry'
import { AppLogo } from '../AppLogo'
import { ExportReportModal } from '../ExportReportModal'

interface ToolbarProps {
  onNewProject: () => void
  onOpenProject: () => void
}

export function Toolbar({ onNewProject, onOpenProject }: ToolbarProps): React.ReactElement {
  const store = useProjectStore()
  const activeView = useProjectStore((s) => s.activeView)
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [showReport, setShowReport] = useState(false)

  const activeProjectId =
    'projectId' in activeView ? (activeView as { projectId: string }).projectId : null
  const activeBowtieId = activeView.kind === 'bowtie' ? activeView.bowtieId : null
  const project = activeProjectId ? store.getProject(activeProjectId) : undefined

  const flash = (msg: string): void => {
    setStatus(msg)
    setTimeout(() => setStatus(''), 3000)
  }

  const closeMenu = (): void => setMenuOpen(false)

  const handleSave = async (): Promise<void> => {
    closeMenu()
    if (!project) return flash('No project open')
    const result = await window.electronAPI.saveProject(JSON.stringify(project), project.filePath)
    if (result.success && result.filePath) {
      store.setProjectFilePath(project.id, result.filePath)
      flash('Project saved')
    }
  }

  const handleExportPng = async (): Promise<void> => {
    closeMenu()
    if (!project || !activeBowtieId) return flash('Open a bowtie first')
    const bowtie = project.bowties.find((b) => b.id === activeBowtieId)
    try {
      flash('Generating PNG…')
      const dataUrl = await captureActiveBowtie()
      if (!dataUrl) return flash('Nothing to export')
      const result = await window.electronAPI.exportPng(dataUrl, bowtie?.name ?? 'bowtie')
      flash(result.success ? 'PNG exported' : 'Export cancelled')
    } catch (e) {
      console.error(e)
      flash('PNG export failed')
    }
  }

  const handleExportExcel = async (): Promise<void> => {
    closeMenu()
    if (!project) return flash('No project open')
    const result = await window.electronAPI.exportExcel(JSON.stringify(project))
    flash(result.success ? 'Excel exported' : 'Export cancelled')
  }

  const MenuItem = ({
    label,
    onClick,
    disabled
  }: {
    label: string
    onClick: () => void
    disabled?: boolean
  }): React.ReactElement => (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700"
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="h-10 bg-slate-900 text-slate-100 flex items-center px-2 gap-1 relative z-30 shrink-0 border-b border-slate-700">
        {/* Logo + app name */}
        <div className="flex items-center gap-2 mr-3 pl-1">
          <AppLogo size={24} />
          <span className="font-bold text-sm text-white tracking-tight">Swiss-Cheese</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-slate-700 text-slate-200"
          >
            File <ChevronDown size={13} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeMenu} />
              <div className="absolute left-0 top-9 z-40 w-56 bg-white rounded shadow-xl border border-gray-200 py-1">
                <MenuItem
                  label="New Project…"
                  onClick={() => {
                    closeMenu()
                    onNewProject()
                  }}
                />
                <MenuItem
                  label="Open Project…"
                  onClick={() => {
                    closeMenu()
                    onOpenProject()
                  }}
                />
                <MenuItem label="Save Project" onClick={handleSave} disabled={!project} />
                <div className="my-1 border-t border-gray-200" />
                <MenuItem
                  label="Project Settings"
                  disabled={!project}
                  onClick={() => {
                    closeMenu()
                    if (project) store.setActiveView({ kind: 'projectSettings', projectId: project.id })
                  }}
                />
                <MenuItem
                  label="Bowtie Settings"
                  disabled={!activeBowtieId}
                  onClick={() => {
                    closeMenu()
                    if (project && activeBowtieId)
                      store.setActiveView({
                        kind: 'bowtieSettings',
                        projectId: project.id,
                        bowtieId: activeBowtieId
                      })
                  }}
                />
                <div className="my-1 border-t border-gray-200" />
                <MenuItem label="Export Bowtie as PNG" onClick={handleExportPng} disabled={!activeBowtieId} />
                <MenuItem
                  label="Export Barriers to Excel"
                  onClick={handleExportExcel}
                  disabled={!project}
                />
                <MenuItem
                  label="Export PDF Report…"
                  onClick={() => {
                    closeMenu()
                    setShowReport(true)
                  }}
                  disabled={!project}
                />
              </div>
            </>
          )}
        </div>

        {/* Quick actions for the active bowtie */}
        {activeView.kind === 'bowtie' && project && (
          <>
            <div className="w-px h-5 bg-slate-600 mx-1" />
            <button
              onClick={() => store.addCause(project.id, activeView.bowtieId)}
              className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white"
            >
              + Threat
            </button>
            <button
              onClick={() => store.addConsequence(project.id, activeView.bowtieId)}
              className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white"
            >
              + Consequence
            </button>
          </>
        )}

        <div className="flex-1" />
        {status && <span className="text-xs text-green-400 mr-2">{status}</span>}
      </div>

      {showReport && project && (
        <ExportReportModal project={project} onClose={() => setShowReport(false)} />
      )}
    </>
  )
}
