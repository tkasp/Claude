import React from 'react'
import type { Bowtie, Project } from '../store/types'

const FIELDS: { key: keyof Bowtie['titleBlock']; label: string }[] = [
  { key: 'documentNumber', label: 'Doc No.' },
  { key: 'documentName', label: 'Document Name' },
  { key: 'revBy', label: 'Rev By' },
  { key: 'revDate', label: 'Rev Date' },
  { key: 'revNumber', label: 'Rev #' }
]

// Read-only title block strip shown beneath the canvas. Editing happens in
// Bowtie Settings, so these fields are intentionally greyed and non-editable.
export function TitleBlock({
  project,
  bowtie
}: {
  project: Project
  bowtie: Bowtie
}): React.ReactElement {
  return (
    <div className="flex shrink-0 border-t-2 border-gray-300 bg-gray-100" style={{ height: 56 }} id="title-block">
      <div className="flex flex-col justify-center px-3 border-r border-gray-300" style={{ minWidth: 150 }}>
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Facility</div>
        <div className="text-xs font-semibold text-gray-600 truncate">{project.name}</div>
      </div>
      {FIELDS.map((f) => (
        <div
          key={f.key}
          className="flex flex-col justify-center px-3 border-r border-gray-300 last:border-r-0"
          style={{ flex: f.key === 'documentName' ? 2 : 1 }}
        >
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{f.label}</div>
          <div className="text-xs text-gray-500 truncate">{bowtie.titleBlock[f.key] || '—'}</div>
        </div>
      ))}
    </div>
  )
}
