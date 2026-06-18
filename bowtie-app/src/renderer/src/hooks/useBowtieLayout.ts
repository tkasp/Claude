import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { Bowtie } from '../store/types'

const NODE_HEIGHT = 60
const CENTER_X = 760
const TOP_EVENT_SIZE = 150
const TOP_EVENT_Y = 360
const HAZARD_Y = 150
const CAUSE_X = 60
const CONSEQUENCE_X = 1380
const BARRIER_STEP = 180
const FIRST_BARRIER_X = 280
const V_SPACING = 120

// Center anchor points of the top-event circle
const TOP_EVENT_CX = CENTER_X + TOP_EVENT_SIZE / 2
const TOP_EVENT_CY = TOP_EVENT_Y + TOP_EVENT_SIZE / 2

export function useBowtieLayout(bowtie: Bowtie | undefined): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    if (!bowtie) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []

    const edgeStyle = { stroke: '#374151', strokeWidth: 2 }

    // Hazard box (above top event)
    const hazardNodeId = `hazard-${bowtie.id}`
    nodes.push({
      id: hazardNodeId,
      type: 'hazard',
      position: { x: CENTER_X - 10, y: HAZARD_Y },
      data: { bowtieId: bowtie.id, hazard: bowtie.hazard },
      draggable: false
    })

    // Top event circle
    nodes.push({
      id: bowtie.topEvent.id,
      type: 'topEvent',
      position: { x: CENTER_X, y: TOP_EVENT_Y },
      data: { bowtieId: bowtie.id, label: bowtie.topEvent.label },
      draggable: false
    })

    // Hazard -> top event connector
    edges.push({
      id: `e-hazard-${bowtie.id}`,
      source: hazardNodeId,
      target: bowtie.topEvent.id,
      type: 'straight',
      style: edgeStyle,
      sourceHandle: 'bottom',
      targetHandle: 'top'
    })

    // ----- Threats (causes) + barriers on the left -----
    const causeCount = bowtie.causes.length
    const causeSpan = (causeCount - 1) * V_SPACING
    const causeStartY = TOP_EVENT_CY - causeSpan / 2

    bowtie.causes.forEach((cause, ci) => {
      const rowY = causeStartY + ci * V_SPACING
      nodes.push({
        id: cause.id,
        type: 'cause',
        position: { x: CAUSE_X, y: rowY - NODE_HEIGHT / 2 },
        data: { bowtieId: bowtie.id, causeId: cause.id, label: cause.label },
        draggable: false
      })

      let prevId = cause.id
      cause.barriers.forEach((barrier, bi) => {
        const bx = FIRST_BARRIER_X + bi * BARRIER_STEP
        nodes.push({
          id: barrier.id,
          type: 'barrier',
          position: { x: bx, y: rowY - NODE_HEIGHT / 2 },
          data: {
            bowtieId: bowtie.id,
            causeId: cause.id,
            barrierId: barrier.id,
            label: barrier.label,
            effectiveness: barrier.effectiveness,
            isSECE: barrier.isSECE,
            seceId: barrier.seceId
          },
          draggable: false
        })
        edges.push({
          id: `e-${prevId}-${barrier.id}`,
          source: prevId,
          target: barrier.id,
          type: 'smoothstep',
          style: edgeStyle,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        prevId = barrier.id
      })

      // Connect last node in the chain to the top event.
      edges.push({
        id: `e-${prevId}-te-${ci}`,
        source: prevId,
        target: bowtie.topEvent.id,
        type: 'smoothstep',
        style: edgeStyle,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
    })

    // ----- Consequences + mitigations on the right -----
    const conCount = bowtie.consequences.length
    const conSpan = (conCount - 1) * V_SPACING
    const conStartY = TOP_EVENT_CY - conSpan / 2

    bowtie.consequences.forEach((con, ci) => {
      const rowY = conStartY + ci * V_SPACING
      nodes.push({
        id: con.id,
        type: 'consequence',
        position: { x: CONSEQUENCE_X, y: rowY - NODE_HEIGHT / 2 },
        data: {
          bowtieId: bowtie.id,
          consequenceId: con.id,
          label: con.label,
          severity: con.severity
        },
        draggable: false
      })

      let prevId = bowtie.topEvent.id
      con.mitigations.forEach((mit, mi) => {
        // Position mitigations stepping rightward from just after the top event
        const px = TOP_EVENT_CX + 120 + mi * BARRIER_STEP
        nodes.push({
          id: mit.id,
          type: 'mitigation',
          position: { x: px, y: rowY - NODE_HEIGHT / 2 },
          data: {
            bowtieId: bowtie.id,
            consequenceId: con.id,
            mitigationId: mit.id,
            label: mit.label,
            effectiveness: mit.effectiveness,
            isSECE: mit.isSECE,
            seceId: mit.seceId
          },
          draggable: false
        })
        edges.push({
          id: `e-${prevId}-${mit.id}`,
          source: prevId,
          target: mit.id,
          type: 'smoothstep',
          style: edgeStyle,
          sourceHandle: 'right',
          targetHandle: 'left'
        })
        prevId = mit.id
      })

      edges.push({
        id: `e-${prevId}-con-${ci}`,
        source: prevId,
        target: con.id,
        type: 'smoothstep',
        style: edgeStyle,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
    })

    return { nodes, edges }
  }, [bowtie])
}
