import React from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useProjectStore, type ActionTarget } from '../store/projectStore'
import type { Barrier, Mitigation } from '../store/types'

interface Props {
  projectId: string
  target: ActionTarget
  onClose: () => void
}

export function ActionsModal({ projectId, target, onClose }: Props): React.ReactElement | null {
  const store = useProjectStore()
  useProjectStore((s) => s.projects)

  const bowtie = store.getBowtie(projectId, target.bowtieId)
  let item: Barrier | Mitigation | undefined
  let itemLabel = ''
  if (bowtie) {
    if (target.kind === 'barrier') {
      const cause = bowtie.causes.find((c) => c.id === target.causeId)
      item = cause?.barriers.find((b) => b.id === target.barrierId)
    } else {
      const con = bowtie.consequences.find((c) => c.id === target.consequenceId)
      item = con?.mitigations.find((m) => m.id === target.mitigationId)
    }
    itemLabel = item?.label ?? ''
  }

  if (!item) return null
  const actions = item.actions ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col w-[680px] max-w-[95vw] max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-semibold text-gray-900">Actions — {target.kind === 'barrier' ? 'Barrier' : 'Mitigation'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{itemLabel}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {actions.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">No actions yet. Use "Add Action" to create one.</div>
          )}
          {actions.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-1 w-16">Action #</th>
                  <th className="px-2 py-1">Description</th>
                  <th className="px-2 py-1 w-40">Due Date</th>
                  <th className="px-2 py-1 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 align-top">
                    <td className="px-2 py-2 font-mono font-semibold text-violet-700">{a.number}</td>
                    <td className="px-2 py-2">
                      <textarea
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-y focus:outline-none focus:border-blue-500"
                        rows={2} placeholder="Action description…" value={a.text}
                        onChange={(e) => store.updateAction(projectId, target, a.id, { text: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        value={a.dueDate}
                        onChange={(e) => store.updateAction(projectId, target, a.id, { dueDate: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button title="Delete action" onClick={() => store.deleteAction(projectId, target, a.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button onClick={() => store.addAction(projectId, target)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-violet-600 text-white font-semibold hover:bg-violet-700">
            <Plus size={14} /> Add Action
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100">Done</button>
        </div>
      </div>
    </div>
  )
}
