import React from 'react'
import { Save, FolderOpen, Image, FileSpreadsheet } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useProjectStore } from '../../store/projectStore'

declare global {
  interface Window {
    electronAPI: {
      saveProject: (json: string) => Promise<{ success: boolean; filePath?: string }>
      openProject: () => Promise<{ success: boolean; data?: string }>
      exportPng: (dataUrl: string, name: string) => Promise<{ success: boolean; filePath?: string }>
      exportExcel: (json: string) => Promise<{ success: boolean; filePath?: string }>
      showFile: (path: string) => Promise<{ success: true }>
    }
  }
}

export function Toolbar(): React.ReactElement {
  const project = useProjectStore((s) => s.project)
  const activeBowtieId = useProjectStore((s) => s.activeBowtieId)
  const loadProject = useProjectStore((s) => s.loadProject)
  const [status, setStatus] = React.useState('')

  const showStatus = (msg: string): void => {
    setStatus(msg)
    setTimeout(() => setStatus(''), 3000)
  }

  const handleSave = async (): Promise<void> => {
    const result = await window.electronAPI.saveProject(JSON.stringify(project, null, 2))
    if (result.success) showStatus('Project saved')
    else showStatus('Save cancelled')
  }

  const handleOpen = async (): Promise<void> => {
    const result = await window.electronAPI.openProject()
    if (result.success && result.data) {
      try {
        const proj = JSON.parse(result.data)
        loadProject(proj)
        showStatus('Project loaded')
      } catch {
        showStatus('Invalid project file')
      }
    }
  }

  const handleExportPng = async (): Promise<void> => {
    const el = document.getElementById('bowtie-canvas-export')
    if (!el) { showStatus('No canvas to export'); return }
    try {
      showStatus('Generating PNG...')
      const dataUrl = await toPng(el, { backgroundColor: '#0f172a', pixelRatio: 2 })
      const bowtie = project.bowties.find((b) => b.id === activeBowtieId)
      const name = bowtie?.name ?? 'bowtie'
      const result = await window.electronAPI.exportPng(dataUrl, name)
      if (result.success) showStatus('PNG exported')
      else showStatus('Export cancelled')
    } catch (err) {
      console.error(err)
      showStatus('PNG export failed')
    }
  }

  const handleExportExcel = async (): Promise<void> => {
    const result = await window.electronAPI.exportExcel(JSON.stringify(project))
    if (result.success) showStatus('Excel exported')
    else showStatus('Export cancelled')
  }

  return (
    <div className="h-11 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-2">
      <span className="text-sm font-bold text-blue-400 mr-3">Bowtie Risk Diagram</span>

      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded transition-colors"
      >
        <Save size={13} /> Save
      </button>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded transition-colors"
      >
        <FolderOpen size={13} /> Open
      </button>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <button
        onClick={handleExportPng}
        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded transition-colors"
      >
        <Image size={13} /> Export PNG
      </button>
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded transition-colors"
      >
        <FileSpreadsheet size={13} /> Export Excel
      </button>

      {status && (
        <span className="ml-auto text-xs text-green-400">{status}</span>
      )}
    </div>
  )
}
