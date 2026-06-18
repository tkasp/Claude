import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useProjectStore } from '../../store/projectStore'
import { severityLabel } from '../../lib/severity'

interface ConsequenceNodeData {
  bowtieId: string
  consequenceId: string
  label: string
  severity: string
}

const SEVERITY_COLORS: Record<string, string> = {
  Catastrophic: '#7f1d1d',
  Major: '#dc2626',
  Moderate: '#f97316',
  Minor: '#eab308',
  Negligible: '#16a34a'
}

export function ConsequenceNode({ data }: { data: ConsequenceNodeData }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const selectedNode = useProjectStore((s) => s.selectedNode)
  const isSelected =
    selectedNode?.kind === 'consequence' &&
    selectedNode.bowtieId === data.bowtieId &&
    selectedNode.consequenceId === data.consequenceId

  return (
    <div
      onClick={() =>
        setSelectedNode({
          kind: 'consequence',
          bowtieId: data.bowtieId,
          consequenceId: data.consequenceId
        })
      }
      style={{
        width: 150,
        minHeight: 56,
        background: '#dc2626',
        border: isSelected ? '3px solid #fca5a5' : '2px solid #991b1b',
        borderRadius: 8,
        color: 'white',
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {data.label}
      </div>
      {data.severity && (
        <div
          style={{
            background: SEVERITY_COLORS[data.severity] ?? '#6b7280',
            padding: '2px 6px',
            fontSize: 10,
            fontWeight: 700
          }}
        >
          {severityLabel(data.severity)}
        </div>
      )}
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
    </div>
  )
}
