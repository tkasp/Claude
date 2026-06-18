import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface TopEventNodeData { bowtieId: string; label: string }

export function TopEventNode({ data }: { data: TopEventNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected = selectedNode?.kind === 'topEvent' && selectedNode.bowtieId === data.bowtieId

  return (
    <div
      onClick={() => setSelectedNode({ kind: 'topEvent', bowtieId: data.bowtieId })}
      style={{ width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle at 42% 35%, #fb923c 0%, #ea580c 45%, #b91c1c 100%)', border: isSelected ? '4px solid #2563eb' : '4px solid #991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, cursor: 'pointer', boxShadow: '0 4px 14px rgba(185,28,28,0.45)' }}
    >
      <span style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>{data.label || 'Top Event'}</span>
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
    </div>
  )
}
