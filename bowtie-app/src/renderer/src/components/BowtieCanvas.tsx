import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProjectStore } from '../store/projectStore'
import { useBowtieLayout } from '../hooks/useBowtieLayout'
import { TopEventNode } from './nodes/TopEventNode'
import { CauseNode } from './nodes/CauseNode'
import { ConsequenceNode } from './nodes/ConsequenceNode'
import { BarrierNode } from './nodes/BarrierNode'
import { MitigationNode } from './nodes/MitigationNode'
import { TitleBlock } from './TitleBlock'

const nodeTypes: NodeTypes = {
  topEvent: TopEventNode as any,
  cause: CauseNode as any,
  consequence: ConsequenceNode as any,
  barrier: BarrierNode as any,
  mitigation: MitigationNode as any
}

export function BowtieCanvas(): React.ReactElement {
  const project = useProjectStore((s) => s.project)
  const activeBowtieId = useProjectStore((s) => s.activeBowtieId)
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)

  const activeBowtie = useMemo(
    () => project.bowties.find((b) => b.id === activeBowtieId),
    [project, activeBowtieId]
  )

  const { nodes, edges } = useBowtieLayout(activeBowtie)

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  return (
    <div className="flex-1 relative overflow-hidden" id="bowtie-canvas-export">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2937" />
        <Controls className="bg-gray-800 border-gray-600" />
        <MiniMap
          className="bg-gray-900 border border-gray-700"
          nodeColor="#1e3a5f"
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
      {/* TitleBlock rendered outside in App.tsx */}
    </div>
  )
}
