import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface TopEventNodeData {
  bowtieId: string
  label: string
}

export function TopEventNode({ data }: { data: TopEventNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected = selectedNode?.kind === 'topEvent' && selectedNode.bowtieId === data.bowtieId

  return (
    <div
      className={`
        flex items-center justify-center cursor-pointer select-none
        rounded-full border-4 bg-blue-900
        transition-all duration-150
        ${isSelected ? 'border-blue-400 shadow-lg shadow-blue-500/40' : 'border-blue-600'}
      `}
      style={{ width: 140, height: 140 }}
      onClick={() => setSelectedNode({ kind: 'topEvent', bowtieId: data.bowtieId })}
    >
      <span className="text-center text-white font-bold text-sm px-2 leading-tight">
        {data.label || 'Top Event'}
      </span>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
