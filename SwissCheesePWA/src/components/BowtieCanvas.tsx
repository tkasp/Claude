import React, { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  BackgroundVariant, useReactFlow, type Node, type NodeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProjectStore } from '../store/projectStore'
import { useBowtieLayout } from '../hooks/useBowtieLayout'
import { HazardNode } from './nodes/HazardNode'
import { TopEventNode } from './nodes/TopEventNode'
import { CauseNode } from './nodes/CauseNode'
import { ConsequenceNode } from './nodes/ConsequenceNode'
import { BarrierNode } from './nodes/BarrierNode'
import { MitigationNode } from './nodes/MitigationNode'
import { registerCapturer } from '../lib/exportRegistry'
import { captureBowtieDataUrl } from '../lib/exportImage'
import type { Bowtie, Project } from '../store/types'

const nodeTypes: NodeTypes = {
  hazard: HazardNode as unknown as NodeTypes[string],
  topEvent: TopEventNode as unknown as NodeTypes[string],
  cause: CauseNode as unknown as NodeTypes[string],
  consequence: ConsequenceNode as unknown as NodeTypes[string],
  barrier: BarrierNode as unknown as NodeTypes[string],
  mitigation: MitigationNode as unknown as NodeTypes[string]
}

const NODE_HALF_HEIGHT = 30

function CanvasInner({ project, bowtie }: { project: Project; bowtie: Bowtie }): React.ReactElement {
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode)
  const setCauseManualY = useProjectStore((s) => s.setCauseManualY)
  const setConsequenceManualY = useProjectStore((s) => s.setConsequenceManualY)
  const { nodes, edges } = useBowtieLayout(bowtie)
  const instance = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode])

  const onNodeDragStop = useCallback(
    (_e: unknown, node: Node) => {
      const centreY = node.position.y + NODE_HALF_HEIGHT
      if (node.type === 'cause') {
        setCauseManualY(project.id, bowtie.id, node.data.causeId as string, centreY)
      } else if (node.type === 'consequence') {
        setConsequenceManualY(project.id, bowtie.id, node.data.consequenceId as string, centreY)
      }
    },
    [project.id, bowtie.id, setCauseManualY, setConsequenceManualY]
  )

  useEffect(() => {
    registerCapturer(async () => {
      if (!wrapperRef.current) throw new Error('canvas not ready')
      return captureBowtieDataUrl(instance, wrapperRef.current, project, bowtie)
    })
    return () => registerCapturer(null)
  }, [instance, project, bowtie])

  return (
    <div ref={wrapperRef} style={{ flex: 1, minWidth: 0, background: '#f4f5f7' }}>
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        onPaneClick={onPaneClick} onNodeDragStop={onNodeDragStop}
        fitView fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2} maxZoom={2}
        nodesDraggable nodesConnectable={false} elementsSelectable
        zoomOnScroll panOnScroll={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#f4f5f7' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable zoomable
          nodeColor={(n) => {
            if (n.type === 'topEvent') return '#ea580c'
            if (n.type === 'cause') return '#1d4ed8'
            if (n.type === 'consequence') return '#dc2626'
            if (n.type === 'hazard') return '#fbbf24'
            return '#94a3b8'
          }}
          maskColor="rgba(15,23,42,0.08)"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        />
      </ReactFlow>
    </div>
  )
}

export function BowtieCanvas({ project, bowtie }: { project: Project; bowtie: Bowtie }): React.ReactElement {
  return (
    <ReactFlowProvider>
      <CanvasInner project={project} bowtie={bowtie} />
    </ReactFlowProvider>
  )
}
