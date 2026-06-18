import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Plus,
  Settings,
  Copy,
  Trash2,
  X
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import type { AttachmentCategory, Project } from '../store/types'

interface SidebarProps {
  onNewProject: () => void
  onOpenProject: () => void
}

export function ProjectSidebar({ onNewProject, onOpenProject }: SidebarProps): React.ReactElement {
  const projects = useProjectStore((s) => s.projects)
  const activeView = useProjectStore((s) => s.activeView)
  const store = useProjectStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const isOpen = (key: string, fallback = true): boolean => expanded[key] ?? fallback
  const toggle = (key: string): void => setExpanded((e) => ({ ...e, [key]: !isOpen(key) }))

  const activeBowtieId = activeView.kind === 'bowtie' ? activeView.bowtieId : null

  const handleAddAttachment = async (
    projectId: string,
    category: AttachmentCategory
  ): Promise<void> => {
    const picked = await window.electronAPI.pickAttachment(category)
    if (picked) store.addAttachment(projectId, { id: picked.id, ...picked, category })
  }

  const openAttachment = async (projectId: string, attachmentId: string): Promise<void> => {
    const project = store.getProject(projectId)
    const att = [...(project?.drawings ?? []), ...(project?.hazid ?? [])].find(
      (a) => a.id === attachmentId
    )
    if (att?.dataBase64) {
      await window.electronAPI.openAttachment({
        name: att.name,
        ext: att.ext,
        dataBase64: att.dataBase64
      })
    }
  }

  return (
    <div className="w-64 shrink-0 bg-gray-100 border-r border-gray-300 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Facilities</span>
        <div className="flex gap-1">
          <button title="Open project" onClick={onOpenProject} className="text-gray-500 hover:text-gray-900">
            <Folder size={15} />
          </button>
          <button title="New project" onClick={onNewProject} className="text-gray-500 hover:text-gray-900">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1 text-sm">
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center text-gray-400 text-xs">
            No facilities open.
            <br />
            Use + to create one.
          </div>
        )}

        {projects.map((project) => (
          <ProjectTree
            key={project.id}
            project={project}
            isOpen={isOpen}
            toggle={toggle}
            activeBowtieId={activeBowtieId}
            onAddAttachment={handleAddAttachment}
            onOpenAttachment={openAttachment}
          />
        ))}
      </div>
    </div>
  )
}

function Row({
  depth,
  icon,
  label,
  active,
  onClick,
  actions
}: {
  depth: number
  icon: React.ReactNode
  label: React.ReactNode
  active?: boolean
  onClick?: () => void
  actions?: React.ReactNode
}): React.ReactElement {
  return (
    <div
      className={`group flex items-center gap-1.5 pr-2 py-1 cursor-pointer ${
        active ? 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-200'
      }`}
      style={{ paddingLeft: 8 + depth * 14 }}
      onClick={onClick}
    >
      <span className="shrink-0 flex items-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {actions && <span className="flex gap-1 opacity-0 group-hover:opacity-100">{actions}</span>}
    </div>
  )
}

function ProjectTree({
  project,
  isOpen,
  toggle,
  activeBowtieId,
  onAddAttachment,
  onOpenAttachment
}: {
  project: Project
  isOpen: (key: string, fallback?: boolean) => boolean
  toggle: (key: string) => void
  activeBowtieId: string | null
  onAddAttachment: (projectId: string, category: AttachmentCategory) => void
  onOpenAttachment: (projectId: string, attachmentId: string) => void
}): React.ReactElement {
  const store = useProjectStore()
  const pKey = `p:${project.id}`
  const drawKey = `d:${project.id}`
  const hazKey = `h:${project.id}`
  const btKey = `b:${project.id}`

  return (
    <div>
      <Row
        depth={0}
        icon={isOpen(pKey) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        label={<span className="font-semibold">{project.name}</span>}
        onClick={() => toggle(pKey)}
        actions={
          <>
            <button
              title="Project settings"
              onClick={(e) => {
                e.stopPropagation()
                store.setActiveView({ kind: 'projectSettings', projectId: project.id })
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              <Settings size={13} />
            </button>
            <button
              title="Close project"
              onClick={(e) => {
                e.stopPropagation()
                store.closeProject(project.id)
              }}
              className="text-gray-500 hover:text-red-600"
            >
              <X size={13} />
            </button>
          </>
        }
      />

      {isOpen(pKey) && (
        <>
          {/* 1. Drawings */}
          <Row
            depth={1}
            icon={isOpen(drawKey, false) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            label="1. Drawings"
            onClick={() => toggle(drawKey)}
            actions={
              <button
                title="Add drawing"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddAttachment(project.id, 'drawing')
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <Plus size={13} />
              </button>
            }
          />
          {isOpen(drawKey, false) &&
            project.drawings.map((a) => (
              <Row
                key={a.id}
                depth={2}
                icon={<FileText size={13} className="text-gray-500" />}
                label={a.name}
                onClick={() => onOpenAttachment(project.id, a.id)}
                actions={
                  <button
                    title="Remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeAttachment(project.id, 'drawing', a.id)
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                }
              />
            ))}

          {/* 2. HAZID */}
          <Row
            depth={1}
            icon={isOpen(hazKey, false) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            label="2. HAZID"
            onClick={() => toggle(hazKey)}
            actions={
              <button
                title="Add HAZID file"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddAttachment(project.id, 'hazid')
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <Plus size={13} />
              </button>
            }
          />
          {isOpen(hazKey, false) &&
            project.hazid.map((a) => (
              <Row
                key={a.id}
                depth={2}
                icon={<FileSpreadsheet size={13} className="text-green-600" />}
                label={a.name}
                onClick={() => onOpenAttachment(project.id, a.id)}
                actions={
                  <button
                    title="Remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeAttachment(project.id, 'hazid', a.id)
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                }
              />
            ))}

          {/* 3. Bowties */}
          <Row
            depth={1}
            icon={isOpen(btKey) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            label="3. Bowties"
            onClick={() => toggle(btKey)}
            actions={
              <button
                title="Add bowtie"
                onClick={(e) => {
                  e.stopPropagation()
                  store.addBowtie(project.id)
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <Plus size={13} />
              </button>
            }
          />
          {isOpen(btKey) &&
            project.bowties.map((bt) => (
              <Row
                key={bt.id}
                depth={2}
                icon={<GitBranch size={13} className="text-blue-600" />}
                label={bt.name}
                active={activeBowtieId === bt.id}
                onClick={() => store.openBowtie(project.id, bt.id)}
                actions={
                  <>
                    <button
                      title="Bowtie settings"
                      onClick={(e) => {
                        e.stopPropagation()
                        store.setActiveView({
                          kind: 'bowtieSettings',
                          projectId: project.id,
                          bowtieId: bt.id
                        })
                      }}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <Settings size={12} />
                    </button>
                    <button
                      title="Duplicate"
                      onClick={(e) => {
                        e.stopPropagation()
                        store.duplicateBowtie(project.id, bt.id)
                      }}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (project.bowties.length > 1) store.deleteBowtie(project.id, bt.id)
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                }
              />
            ))}
        </>
      )}
    </div>
  )
}
