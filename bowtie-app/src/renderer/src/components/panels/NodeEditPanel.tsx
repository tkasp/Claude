import React from 'react'
import { useProjectStore } from '../../store/projectStore'
import type { Barrier, Consequence } from '../../store/types'
import { SEVERITY_OPTIONS, severityLabel } from '../../lib/severity'
const EFFECTIVENESS_OPTIONS: Array<Barrier['effectiveness']> = [
  'Effective',
  'Partially Effective',
  'Ineffective'
]
const EFF_COLORS: Record<string, string> = {
  Effective: '#16a34a',
  'Partially Effective': '#eab308',
  Ineffective: '#f97316'
}

const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-3 mb-1'
const inputCls =
  'w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500'

// Defined at module scope so its identity is stable across renders. When this
// lived inside NodeEditPanel, every keystroke created a new component type,
// remounting the subtree and stealing focus from the input after one character.
function Wrap({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="w-72 shrink-0 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {children}
    </div>
  )
}

export function NodeEditPanel(): React.ReactElement {
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const activeView = useProjectStore((s) => s.activeView)
  const store = useProjectStore()

  const projectId = activeView.kind === 'bowtie' ? activeView.projectId : null

  if (!selectedNode || !projectId) {
    return (
      <div className="w-72 shrink-0 bg-gray-50 border-l border-gray-200 p-4 text-gray-400 text-sm flex items-center justify-center text-center">
        Select an item on the diagram to edit its properties.
      </div>
    )
  }

  const bowtie = store.getBowtie(projectId, selectedNode.bowtieId)
  if (!bowtie) return <div className="w-72 shrink-0 bg-gray-50 border-l border-gray-200" />

  if (selectedNode.kind === 'hazard') {
    return (
      <Wrap title="Hazard">
        <div className={labelCls}>Hazard ID</div>
        <input
          className={inputCls}
          value={bowtie.hazard.hazardId}
          placeholder="e.g. WBT-H.03"
          onChange={(e) => store.updateHazard(projectId, bowtie.id, { hazardId: e.target.value })}
        />
        <div className={labelCls}>Hazard Name</div>
        <input
          className={inputCls}
          value={bowtie.hazard.name}
          placeholder="e.g. Lifting operations"
          onChange={(e) => store.updateHazard(projectId, bowtie.id, { name: e.target.value })}
        />
      </Wrap>
    )
  }

  if (selectedNode.kind === 'topEvent') {
    return (
      <Wrap title="Top Event">
        <div className={labelCls}>Label</div>
        <input
          className={inputCls}
          value={bowtie.topEvent.label}
          onChange={(e) => store.updateTopEvent(projectId, bowtie.id, e.target.value)}
        />
      </Wrap>
    )
  }

  if (selectedNode.kind === 'cause') {
    const cause = bowtie.causes.find((c) => c.id === selectedNode.causeId)
    if (!cause) return <Wrap title="Threat">Not found</Wrap>
    return (
      <Wrap title="Threat">
        <div className={labelCls}>Label</div>
        <input
          className={inputCls}
          value={cause.label}
          onChange={(e) => store.updateCause(projectId, bowtie.id, cause.id, e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded py-2"
          onClick={() => store.addBarrier(projectId, bowtie.id, cause.id)}
        >
          + Add Barrier
        </button>
        <button
          className="mt-2 w-full bg-red-800 hover:bg-red-900 text-white text-xs font-semibold rounded py-2"
          onClick={() => {
            store.deleteCause(projectId, bowtie.id, cause.id)
            store.setSelectedNode(null)
          }}
        >
          Delete Threat
        </button>
      </Wrap>
    )
  }

  if (selectedNode.kind === 'consequence') {
    const con = bowtie.consequences.find((c) => c.id === selectedNode.consequenceId)
    if (!con) return <Wrap title="Consequence">Not found</Wrap>
    return (
      <Wrap title="Consequence">
        <div className={labelCls}>Label</div>
        <input
          className={inputCls}
          value={con.label}
          onChange={(e) => store.updateConsequence(projectId, bowtie.id, con.id, { label: e.target.value })}
        />
        <div className={labelCls}>Severity</div>
        <select
          className={inputCls}
          value={con.severity}
          onChange={(e) =>
            store.updateConsequence(projectId, bowtie.id, con.id, {
              severity: e.target.value as Consequence['severity']
            })
          }
        >
          <option value="">— Select —</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {severityLabel(s)}
            </option>
          ))}
        </select>
        <button
          className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded py-2"
          onClick={() => store.addMitigation(projectId, bowtie.id, con.id)}
        >
          + Add Mitigation
        </button>
        <button
          className="mt-2 w-full bg-red-800 hover:bg-red-900 text-white text-xs font-semibold rounded py-2"
          onClick={() => {
            store.deleteConsequence(projectId, bowtie.id, con.id)
            store.setSelectedNode(null)
          }}
        >
          Delete Consequence
        </button>
      </Wrap>
    )
  }

  if (selectedNode.kind === 'barrier') {
    const cause = bowtie.causes.find((c) => c.id === selectedNode.causeId)
    const barrier = cause?.barriers.find((b) => b.id === selectedNode.barrierId)
    if (!barrier || !cause) return <Wrap title="Barrier">Not found</Wrap>
    return (
      <BarrierForm
        title="Barrier"
        item={barrier}
        onUpdate={(u) => store.updateBarrier(projectId, bowtie.id, cause.id, barrier.id, u)}
        onManageActions={() =>
          store.setActionsTarget({
            kind: 'barrier',
            bowtieId: bowtie.id,
            causeId: cause.id,
            barrierId: barrier.id
          })
        }
        onDelete={() => {
          store.deleteBarrier(projectId, bowtie.id, cause.id, barrier.id)
          store.setSelectedNode(null)
        }}
      />
    )
  }

  if (selectedNode.kind === 'mitigation') {
    const con = bowtie.consequences.find((c) => c.id === selectedNode.consequenceId)
    const mit = con?.mitigations.find((m) => m.id === selectedNode.mitigationId)
    if (!mit || !con) return <Wrap title="Mitigation">Not found</Wrap>
    return (
      <BarrierForm
        title="Mitigation"
        item={mit}
        onUpdate={(u) => store.updateMitigation(projectId, bowtie.id, con.id, mit.id, u)}
        onManageActions={() =>
          store.setActionsTarget({
            kind: 'mitigation',
            bowtieId: bowtie.id,
            consequenceId: con.id,
            mitigationId: mit.id
          })
        }
        onDelete={() => {
          store.deleteMitigation(projectId, bowtie.id, con.id, mit.id)
          store.setSelectedNode(null)
        }}
      />
    )
  }

  return <Wrap title="Properties">—</Wrap>
}

function BarrierForm({
  title,
  item,
  onUpdate,
  onManageActions,
  onDelete
}: {
  title: string
  item: Barrier
  onUpdate: (u: Partial<Barrier>) => void
  onManageActions: () => void
  onDelete: () => void
}): React.ReactElement {
  return (
    <div className="w-72 shrink-0 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>

      <div className={labelCls}>Label</div>
      <input className={inputCls} value={item.label} onChange={(e) => onUpdate({ label: e.target.value })} />

      <div className={labelCls}>Effectiveness</div>
      <div className="flex flex-col gap-1.5">
        {EFFECTIVENESS_OPTIONS.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <span
              onClick={() => onUpdate({ effectiveness: opt })}
              className="w-3.5 h-3.5 rounded-full shrink-0 cursor-pointer"
              style={{
                background: item.effectiveness === opt ? EFF_COLORS[opt] : 'transparent',
                border: `2px solid ${EFF_COLORS[opt]}`
              }}
            />
            {opt}
          </label>
        ))}
      </div>

      <div className={labelCls}>Effectiveness Description</div>
      <textarea
        className={`${inputCls} resize-y`}
        rows={3}
        placeholder="Basis for the effectiveness rating…"
        value={item.effectivenessDescription}
        onChange={(e) => onUpdate({ effectivenessDescription: e.target.value })}
      />

      <div className={labelCls}>SECE</div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={item.isSECE}
          onChange={(e) => onUpdate({ isSECE: e.target.checked })}
        />
        Safety / Environmentally Critical Element
      </label>

      <div className={labelCls}>SECE ID #</div>
      <input
        className={inputCls}
        value={item.seceId}
        disabled={!item.isSECE}
        placeholder={item.isSECE ? 'e.g. SE-04' : ''}
        style={{ background: item.isSECE ? 'white' : '#f1f5f9', color: item.isSECE ? '#111827' : '#94a3b8' }}
        onChange={(e) => onUpdate({ seceId: e.target.value })}
      />

      <button
        className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded py-2"
        onClick={onManageActions}
      >
        Manage Actions{item.actions?.length ? ` (${item.actions.length})` : ''}
      </button>

      <button
        className="mt-2 w-full bg-red-800 hover:bg-red-900 text-white text-xs font-semibold rounded py-2"
        onClick={onDelete}
      >
        Delete {title}
      </button>
    </div>
  )
}
