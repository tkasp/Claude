import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface CauseNodeData {
  bowtieId: string
  causeId: string
  label: string
}

export function CauseNode({ data }: { data: CauseNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected =
    selectedNode?.kind === 'cause' &&
    selectedNode.bowtieId === data.bowtieId &&
    selectedNode.causeId === data.causeId

  return (
    <div
      className={`
        flex items-center justify-center cursor-pointer select-none
        rounded-lg border-2 bg-orange-900/70 min-w-[140px] px-3 py-2
        transition-all duration-150
        ${isSelected ? 'border-orange-400 shadow-lg shadow-orange-500/40' : 'border-orange-600'}
      `}
      style={{ width: 140, minHeight: 55 }}
      onClick={() =>
        setSelectedNode({ kind: 'cause', bowtieId: data.bowtieId, causeId: data.causeId })
      }
    >
      <span className="text-center text-white text-xs font-medium leading-tight">
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
