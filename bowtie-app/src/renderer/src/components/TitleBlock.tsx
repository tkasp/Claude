import React from 'react'
import { useProjectStore } from '../store/projectStore'
import type { TitleBlock as TitleBlockType } from '../store/types'

const FIELDS: { key: keyof TitleBlockType; label: string }[] = [
  { key: 'documentNumber', label: 'Doc No.' },
  { key: 'documentName', label: 'Document Name' },
  { key: 'revBy', label: 'Rev By' },
  { key: 'revDate', label: 'Rev Date' },
  { key: 'revNumber', label: 'Rev #' }
]

export function TitleBlock(): React.ReactElement | null {
  const store = useProjectStore()
  const { project, activeBowtieId } = store
  const bowtie = project?.bowties.find((b) => b.id === activeBowtieId)
  if (!bowtie) return null

  return (
    <div
      className="flex border-t border-gray-700 bg-gray-900 shrink-0"
      style={{ height: 60 }}
      id="title-block"
    >
      {FIELDS.map((f, i) => (
        <div
          key={f.key}
          className={`flex flex-col justify-center px-3 py-1 ${i < FIELDS.length - 1 ? 'border-r border-gray-700' : ''} ${f.key === 'documentName' ? 'flex-[2]' : 'flex-1'}`}
        >
          <div className="text-gray-500 font-semibold uppercase tracking-wider mb-0.5" style={{ fontSize: 9 }}>
            {f.label}
          </div>
          <input
            value={bowtie.titleBlock[f.key]}
            onChange={(e) => store.updateTitleBlock(bowtie.id, { [f.key]: e.target.value })}
            placeholder={`Enter ${f.label}`}
            className="bg-transparent border-0 border-b border-gray-700 text-white text-xs py-0.5 w-full focus:outline-none focus:border-blue-500"
          />
        </div>
      ))}
    </div>
  )
}
