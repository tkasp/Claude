import React from 'react'
import { X, Trash2, Plus } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import type { Barrier } from '../../store/types'

export function NodeEditPanel(): React.ReactElement | null {
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const project = useProjectStore((s) => s.project)
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const store = useProjectStore()

  if (!selectedNode) return null

  const bowtie = project.bowties.find((b) => b.id === selectedNode.bowtieId)
  if (!bowtie) return null

  const renderContent = (): React.ReactElement => {
    if (selectedNode.kind === 'topEvent') {
      return (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-300">Top Event</h3>
          <label className="text-xs text-gray-400">Label</label>
          <input
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            value={bowtie.topEvent.label}
            onChange={(e) => store.updateTopEvent(bowtie.id, e.target.value)}
          />
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Title Block</h4>
            {(['documentNumber', 'documentName', 'revBy', 'revDate', 'revNumber'] as const).map((field) => (
              <div key={field} className="mb-2">
                <label className="text-xs text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  className="w-full mt-0.5 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={bowtie.titleBlock[field]}
                  onChange={(e) => store.updateTitleBlock(bowtie.id, { [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="flex items-center gap-1 bg-orange-800 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded"
              onClick={() => store.addCause(bowtie.id)}
            >
              <Plus size={12} /> Add Cause
            </button>
            <button
              className="flex items-center gap-1 bg-purple-800 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded"
              onClick={() => store.addConsequence(bowtie.id)}
            >
              <Plus size={12} /> Add Consequence
            </button>
          </div>
        </div>
      )
    }

    if (selectedNode.kind === 'cause') {
      const cause = bowtie.causes.find((c) => c.id === selectedNode.causeId)
      if (!cause) return <div>Not found</div>
      return (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-300">Cause</h3>
          <label className="text-xs text-gray-400">Label</label>
          <input
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            value={cause.label}
            onChange={(e) => store.updateCause(bowtie.id, cause.id, e.target.value)}
          />
          <button
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded w-fit"
            onClick={() => store.addBarrier(bowtie.id, cause.id)}
          >
            <Plus size={12} /> Add Barrier
          </button>
          <button
            className="flex items-center gap-1 bg-red-900 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded w-fit mt-2"
            onClick={() => {
              store.deleteCause(bowtie.id, cause.id)
              setSelectedNode(null)
            }}
          >
            <Trash2 size={12} /> Delete Cause
          </button>
        </div>
      )
    }

    if (selectedNode.kind === 'consequence') {
      const consequence = bowtie.consequences.find((c) => c.id === selectedNode.consequenceId)
      if (!consequence) return <div>Not found</div>
      return (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-300">Consequence</h3>
          <label className="text-xs text-gray-400">Label</label>
          <input
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            value={consequence.label}
            onChange={(e) => store.updateConsequence(bowtie.id, consequence.id, { label: e.target.value })}
          />
          <label className="text-xs text-gray-400">Severity</label>
          <select
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            value={consequence.severity}
            onChange={(e) =>
              store.updateConsequence(bowtie.id, consequence.id, { severity: e.target.value as any })
            }
          >
            <option value="">-- Select --</option>
            {['Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded w-fit"
            onClick={() => store.addMitigation(bowtie.id, consequence.id)}
          >
            <Plus size={12} /> Add Mitigation
          </button>
          <button
            className="flex items-center gap-1 bg-red-900 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded w-fit mt-2"
            onClick={() => {
              store.deleteConsequence(bowtie.id, consequence.id)
              setSelectedNode(null)
            }}
          >
            <Trash2 size={12} /> Delete Consequence
          </button>
        </div>
      )
    }

    if (selectedNode.kind === 'barrier') {
      const cause = bowtie.causes.find((c) => c.id === selectedNode.causeId)
      const barrier = cause?.barriers.find((b) => b.id === selectedNode.barrierId)
      if (!barrier || !cause) return <div>Not found</div>
      return <BarrierMitigationForm
        label="Barrier"
        item={barrier}
        onUpdate={(updates) => store.updateBarrier(bowtie.id, cause.id, barrier.id, updates)}
        onDelete={() => {
          store.deleteBarrier(bowtie.id, cause.id, barrier.id)
          setSelectedNode(null)
        }}
      />
    }

    if (selectedNode.kind === 'mitigation') {
      const consequence = bowtie.consequences.find((c) => c.id === selectedNode.consequenceId)
      const mitigation = consequence?.mitigations.find((m) => m.id === selectedNode.mitigationId)
      if (!mitigation || !consequence) return <div>Not found</div>
      return <BarrierMitigationForm
        label="Mitigation"
        item={mitigation}
        onUpdate={(updates) => store.updateMitigation(bowtie.id, consequence.id, mitigation.id, updates)}
        onDelete={() => {
          store.deleteMitigation(bowtie.id, consequence.id, mitigation.id)
          setSelectedNode(null)
        }}
      />
    }

    return <div>Select a node</div>
  }

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-200">Properties</span>
        <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  )
}

function BarrierMitigationForm({
  label,
  item,
  onUpdate,
  onDelete
}: {
  label: string
  item: Barrier
  onUpdate: (updates: Partial<Barrier>) => void
  onDelete: () => void
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300">{label}</h3>
      <label className="text-xs text-gray-400">Label</label>
      <input
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        value={item.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <label className="text-xs text-gray-400">Effectiveness</label>
      <select
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        value={item.effectiveness}
        onChange={(e) => onUpdate({ effectiveness: e.target.value as any })}
      >
        <option value="">-- Select --</option>
        <option value="Effective">Effective</option>
        <option value="Partially Effective">Partially Effective</option>
        <option value="Ineffective">Ineffective</option>
      </select>
      <label className="text-xs text-gray-400">Effectiveness Description</label>
      <textarea
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
        rows={3}
        value={item.effectivenessDescription}
        onChange={(e) => onUpdate({ effectivenessDescription: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sece-check"
          checked={item.isSECE}
          onChange={(e) => onUpdate({ isSECE: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="sece-check" className="text-xs text-gray-400">Is SECE</label>
      </div>
      {item.isSECE && (
        <>
          <label className="text-xs text-gray-400">SECE ID</label>
          <input
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            value={item.seceId}
            onChange={(e) => onUpdate({ seceId: e.target.value })}
            placeholder="e.g. SECE-001"
          />
        </>
      )}
      <button
        className="flex items-center gap-1 bg-red-900 hover:bg-red-800 text-white text-xs px-3 py-1.5 rounded w-fit mt-2"
        onClick={onDelete}
      >
        <Trash2 size={12} /> Delete {label}
      </button>
    </div>
  )
}
