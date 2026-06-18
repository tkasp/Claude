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
      onClick={() => setSelectedNode({ kind: 'cause', bowtieId: data.bowtieId, causeId: data.causeId })}
      style={{
        width: 150,
        minHeight: 56,
        background: '#1d4ed8',
        border: isSelected ? '3px solid #93c5fd' : '2px solid #1e40af',
        borderRadius: 8,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '8px 10px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}
    >
      {data.label}
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
    </div>
  )
}
