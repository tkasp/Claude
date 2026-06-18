import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface MitigationNodeData {
  bowtieId: string
  consequenceId: string
  mitigationId: string
  label: string
  effectiveness: string
  isSECE: boolean
  seceId: string
}

const effectivenessColors: Record<string, string> = {
  Effective: 'border-green-500 bg-green-900/60',
  'Partially Effective': 'border-yellow-500 bg-yellow-900/60',
  Ineffective: 'border-red-500 bg-red-900/60'
}

export function MitigationNode({ data }: { data: MitigationNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected =
    selectedNode?.kind === 'mitigation' &&
    selectedNode.bowtieId === data.bowtieId &&
    selectedNode.consequenceId === data.consequenceId &&
    selectedNode.mitigationId === data.mitigationId

  const colorClass = data.effectiveness
    ? effectivenessColors[data.effectiveness]
    : 'border-gray-500 bg-gray-800'

  return (
    <div
      className={`
        flex flex-col items-center justify-center cursor-pointer select-none
        border-2 px-2 py-1 gap-1 relative
        transition-all duration-150
        ${colorClass}
        ${isSelected ? 'shadow-lg shadow-white/20 brightness-125' : ''}
      `}
      style={{ width: 130, minHeight: 60 }}
      onClick={() =>
        setSelectedNode({
          kind: 'mitigation',
          bowtieId: data.bowtieId,
          consequenceId: data.consequenceId,
          mitigationId: data.mitigationId
        })
      }
    >
      <span className="text-center text-white text-xs font-medium leading-tight">
        {data.label}
      </span>
      {data.isSECE && (
        <span className="text-xs bg-cyan-700 text-white px-1.5 py-0.5 rounded font-bold">
          SECE{data.seceId ? `: ${data.seceId}` : ''}
        </span>
      )}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
