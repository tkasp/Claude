import React, { useState } from 'react'
import type { NewProjectInput } from '../store/projectStore'

const inputCls =
  'w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500'
const lblCls = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1 mt-3'

export function NewProjectModal({
  onCreate,
  onCancel
}: {
  onCreate: (input: NewProjectInput) => void
  onCancel: () => void
}): React.ReactElement {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [revBy, setRevBy] = useState('')
  const [revDate, setRevDate] = useState('')
  const [revNumber, setRevNumber] = useState('')

  const canCreate = name.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[460px] max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-lg font-bold text-gray-800">New Facility Project</h2>
        <p className="text-xs text-gray-500 mt-1">
          These details populate the title block. They can be changed later in Project / Bowtie
          Settings.
        </p>

        <div className={lblCls}>Facility / Project Name *</div>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus />

        <div className={lblCls}>Location</div>
        <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} />

        <div className={lblCls}>Description</div>
        <textarea
          className={`${inputCls} resize-y`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mt-4 mb-1 text-xs font-bold uppercase tracking-wider text-gray-600 border-t border-gray-200 pt-3">
          Title Block
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <div className={lblCls}>Document Number</div>
            <input className={inputCls} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
          <div>
            <div className={lblCls}>Document Name</div>
            <input className={inputCls} value={documentName} onChange={(e) => setDocumentName(e.target.value)} />
          </div>
          <div>
            <div className={lblCls}>Rev By</div>
            <input className={inputCls} value={revBy} onChange={(e) => setRevBy(e.target.value)} />
          </div>
          <div>
            <div className={lblCls}>Rev Date</div>
            <input className={inputCls} value={revDate} onChange={(e) => setRevDate(e.target.value)} />
          </div>
          <div>
            <div className={lblCls}>Rev #</div>
            <input className={inputCls} value={revNumber} onChange={(e) => setRevNumber(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-4 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            disabled={!canCreate}
            className="px-4 py-1.5 text-sm rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
            onClick={() =>
              onCreate({
                name: name.trim(),
                location: location.trim(),
                description: description.trim(),
                titleBlock: { documentNumber, documentName, revBy, revDate, revNumber }
              })
            }
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}
