import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'

interface BarrierNodeData {
  bowtieId: string
  causeId: string
  barrierId: string
  label: string
  effectiveness: string
  isSECE: boolean
  seceId: string
}

export const EFFECTIVENESS_COLORS: Record<string, string> = {
  Effective: '#16a34a',
  'Partially Effective': '#eab308',
  Ineffective: '#f97316'
}

export function BarrierNode({ data }: { data: BarrierNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected =
    selectedNode?.kind === 'barrier' &&
    selectedNode.bowtieId === data.bowtieId &&
    selectedNode.causeId === data.causeId &&
    selectedNode.barrierId === data.barrierId

  const stripe = data.effectiveness ? EFFECTIVENESS_COLORS[data.effectiveness] : '#9ca3af'

  return (
    <div
      onClick={() =>
        setSelectedNode({
          kind: 'barrier',
          bowtieId: data.bowtieId,
          causeId: data.causeId,
          barrierId: data.barrierId
        })
      }
      style={{
        width: 150,
        minHeight: 56,
        background: '#ffffff',
        border: isSelected ? '3px solid #2563eb' : '1px solid #cbd5e1',
        borderLeft: `6px solid ${stripe}`,
        borderRadius: 6,
        color: '#111827',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '8px 10px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
      }}
    >
      {data.isSECE && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -6,
            background: '#0f172a',
            color: '#fbbf24',
            fontSize: 8,
            fontWeight: 800,
            padding: '1px 4px',
            borderRadius: 3,
            border: '1px solid #fbbf24',
            whiteSpace: 'nowrap'
          }}
        >
          {data.seceId ? `SECE #${data.seceId}` : 'SECE'}
        </div>
      )}
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
    </div>
  )
}
