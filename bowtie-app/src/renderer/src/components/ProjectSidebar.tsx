import React, { useState } from 'react'
import { Plus, Copy, Trash2, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'

export function ProjectSidebar(): React.ReactElement {
  const project = useProjectStore((s) => s.project)
  const activeBowtieId = useProjectStore((s) => s.activeBowtieId)
  const store = useProjectStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingProjectName, setEditingProjectName] = useState(false)

  const startRename = (id: string, currentName: string): void => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const commitRename = (id: string): void => {
    if (editingName.trim()) store.renameBowtie(id, editingName.trim())
    setEditingId(null)
  }

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Project name */}
      <div className="px-3 py-3 border-b border-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
          <FolderOpen size={12} />
          <span>Project</span>
        </div>
        {editingProjectName ? (
          <input
            autoFocus
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
            value={project.name}
            onChange={(e) => store.setProjectName(e.target.value)}
            onBlur={() => setEditingProjectName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingProjectName(false) }}
          />
        ) : (
          <div
            className="text-sm font-semibold text-white cursor-pointer hover:text-blue-400 truncate"
            onDoubleClick={() => setEditingProjectName(true)}
          >
            {project.name}
          </div>
        )}
      </div>

      {/* Bowties list */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Bowties</span>
        <button
          className="text-gray-400 hover:text-white"
          title="Add bowtie"
          onClick={() => store.addBowtie()}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {project.bowties.map((bt) => (
          <div
            key={bt.id}
            className={`
              group flex items-center px-3 py-2 cursor-pointer text-sm gap-2
              ${activeBowtieId === bt.id ? 'bg-blue-900/40 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
            `}
            onClick={() => store.setActiveBowtie(bt.id)}
          >
            {activeBowtieId === bt.id ? (
              <ChevronDown size={12} className="shrink-0" />
            ) : (
              <ChevronRight size={12} className="shrink-0" />
            )}

            {editingId === bt.id ? (
              <input
                autoFocus
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => commitRename(bt.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(bt.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startRename(bt.id, bt.name)
                }}
              >
                {bt.name}
              </span>
            )}

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="Duplicate"
                className="hover:text-blue-400"
                onClick={(e) => { e.stopPropagation(); store.duplicateBowtie(bt.id) }}
              >
                <Copy size={12} />
              </button>
              <button
                title="Delete"
                className="hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  if (project.bowties.length > 1) store.deleteBowtie(bt.id)
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
