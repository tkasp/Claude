import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import type { Hazard } from '../../store/types'

interface HazardNodeData {
  bowtieId: string
  hazard: Hazard
}

export function HazardNode({ data }: { data: HazardNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected = selectedNode?.kind === 'hazard' && selectedNode.bowtieId === data.bowtieId

  const stripes =
    'repeating-linear-gradient(45deg, #1f2937 0, #1f2937 12px, #fbbf24 12px, #fbbf24 24px)'

  return (
    <div
      onClick={() => setSelectedNode({ kind: 'hazard', bowtieId: data.bowtieId })}
      style={{
        width: 170,
        padding: 4,
        background: stripes,
        borderRadius: 4,
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 3px #2563eb' : '0 2px 6px rgba(0,0,0,0.25)'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 2,
          padding: '6px 8px',
          textAlign: 'center',
          minHeight: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {data.hazard.hazardId ? (
          <div style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>{data.hazard.hazardId}</div>
        ) : (
          <div style={{ fontWeight: 700, fontSize: 11, color: '#9ca3af' }}>Hazard ID</div>
        )}
        <div style={{ fontSize: 11, color: data.hazard.name ? '#374151' : '#9ca3af' }}>
          {data.hazard.name || 'Hazard name'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
    </div>
  )
}
