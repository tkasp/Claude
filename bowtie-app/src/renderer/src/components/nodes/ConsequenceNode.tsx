import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface ConsequenceNodeData {
  bowtieId: string
  consequenceId: string
  label: string
  severity: string
}

const severityColors: Record<string, string> = {
  Catastrophic: 'bg-red-900/80 border-red-500',
  Major: 'bg-orange-900/80 border-orange-500',
  Moderate: 'bg-yellow-900/80 border-yellow-500',
  Minor: 'bg-green-900/80 border-green-600',
  Negligible: 'bg-gray-800 border-gray-500'
}

const severityBadgeColors: Record<string, string> = {
  Catastrophic: 'bg-red-600',
  Major: 'bg-orange-600',
  Moderate: 'bg-yellow-600',
  Minor: 'bg-green-600',
  Negligible: 'bg-gray-600'
}

export function ConsequenceNode({ data }: { data: ConsequenceNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected =
    selectedNode?.kind === 'consequence' &&
    selectedNode.bowtieId === data.bowtieId &&
    selectedNode.consequenceId === data.consequenceId

  const colorClass = data.severity ? severityColors[data.severity] : 'bg-purple-900/70 border-purple-600'

  return (
    <div
      className={`
        flex flex-col items-center justify-center cursor-pointer select-none
        rounded-lg border-2 px-3 py-2 gap-1
        transition-all duration-150
        ${colorClass}
        ${isSelected ? 'shadow-lg shadow-purple-500/40 brightness-125' : ''}
      `}
      style={{ width: 140, minHeight: 55 }}
      onClick={() =>
        setSelectedNode({
          kind: 'consequence',
          bowtieId: data.bowtieId,
          consequenceId: data.consequenceId
        })
      }
    >
      <span className="text-center text-white text-xs font-medium leading-tight">
        {data.label}
      </span>
      {data.severity && (
        <span className={`text-xs text-white px-1.5 py-0.5 rounded font-bold ${severityBadgeColors[data.severity] ?? 'bg-gray-600'}`}>
          {data.severity}
        </span>
      )}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  )
}
