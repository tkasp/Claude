import React from 'react'
import { useProjectStore } from '../store/projectStore'
import type { TitleBlock } from '../store/types'

const inputCls =
  'w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500'
const lblCls = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1 mt-3'

const TB_FIELDS: { key: keyof TitleBlock; label: string }[] = [
  { key: 'documentNumber', label: 'Document Number' },
  { key: 'documentName', label: 'Document Name' },
  { key: 'revBy', label: 'Rev By' },
  { key: 'revDate', label: 'Rev Date' },
  { key: 'revNumber', label: 'Rev #' }
]

export function ProjectSettingsView({ projectId }: { projectId: string }): React.ReactElement {
  const store = useProjectStore()
  const project = store.getProject(projectId)
  if (!project) return <div className="flex-1 bg-white" />

  return (
    <div className="flex-1 bg-white overflow-y-auto p-8">
      <div className="max-w-xl">
        <h2 className="text-xl font-bold text-gray-800">Project Settings</h2>
        <p className="text-xs text-gray-500 mt-1">Facility-level details and default title block.</p>

        <div className={lblCls}>Facility / Project Name</div>
        <input
          className={inputCls}
          value={project.name}
          onChange={(e) => store.updateProjectMeta(projectId, { name: e.target.value })}
        />

        <div className={lblCls}>Location</div>
        <input
          className={inputCls}
          value={project.location}
          onChange={(e) => store.updateProjectMeta(projectId, { location: e.target.value })}
        />

        <div className={lblCls}>Description</div>
        <textarea
          className={`${inputCls} resize-y`}
          rows={3}
          value={project.description}
          onChange={(e) => store.updateProjectMeta(projectId, { description: e.target.value })}
        />

        <div className="mt-6 mb-1 text-xs font-bold uppercase tracking-wider text-gray-600 border-t border-gray-200 pt-4">
          Default Title Block
        </div>
        <p className="text-xs text-gray-400 mb-2">
          Used as the starting title block for new bowties in this project.
        </p>
        {TB_FIELDS.map((f) => (
          <div key={f.key}>
            <div className={lblCls}>{f.label}</div>
            <input
              className={inputCls}
              value={project.titleBlock[f.key]}
              onChange={(e) => store.updateProjectTitleBlock(projectId, { [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BowtieSettingsView({
  projectId,
  bowtieId
}: {
  projectId: string
  bowtieId: string
}): React.ReactElement {
  const store = useProjectStore()
  const bowtie = store.getBowtie(projectId, bowtieId)
  if (!bowtie) return <div className="flex-1 bg-white" />

  return (
    <div className="flex-1 bg-white overflow-y-auto p-8">
      <div className="max-w-xl">
        <h2 className="text-xl font-bold text-gray-800">Bowtie Settings</h2>
        <p className="text-xs text-gray-500 mt-1">Title block for “{bowtie.name}”.</p>

        <div className={lblCls}>Bowtie Name</div>
        <input
          className={inputCls}
          value={bowtie.name}
          onChange={(e) => store.renameBowtie(projectId, bowtieId, e.target.value)}
        />

        <div className="mt-6 mb-1 text-xs font-bold uppercase tracking-wider text-gray-600 border-t border-gray-200 pt-4">
          Title Block
        </div>
        {TB_FIELDS.map((f) => (
          <div key={f.key}>
            <div className={lblCls}>{f.label}</div>
            <input
              className={inputCls}
              value={bowtie.titleBlock[f.key]}
              onChange={(e) =>
                store.updateBowtieTitleBlock(projectId, bowtieId, { [f.key]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
