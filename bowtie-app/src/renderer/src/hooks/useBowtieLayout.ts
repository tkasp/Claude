import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { Bowtie } from '../store/types'

const NODE_WIDTH = 160
const NODE_HEIGHT = 60
const CAUSE_X = 80
const BARRIER_OFFSET_X = 260
const CENTER_X = 700
const CONSEQUENCE_X = 1300
const MITIGATION_OFFSET_X = 1120
const V_SPACING = 110
const TOP_EVENT_Y = 300

export function useBowtieLayout(bowtie: Bowtie | undefined): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    if (!bowtie) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Top Event
    nodes.push({
      id: bowtie.topEvent.id,
      type: 'topEvent',
      position: { x: CENTER_X, y: TOP_EVENT_Y },
      data: { bowtieId: bowtie.id, label: bowtie.topEvent.label },
      draggable: false
    })

    // Causes and barriers
    const totalCauseHeight = bowtie.causes.length > 0
      ? (bowtie.causes.length - 1) * V_SPACING
      : 0
    const causeStartY = TOP_EVENT_Y - totalCauseHeight / 2

    bowtie.causes.forEach((cause, ci) => {
      const causeY = causeStartY + ci * V_SPACING
      const causeNodeId = cause.id

      nodes.push({
        id: causeNodeId,
        type: 'cause',
        position: { x: CAUSE_X, y: causeY - NODE_HEIGHT / 2 },
        data: { bowtieId: bowtie.id, causeId: cause.id, label: cause.label },
        draggable: false
      })

      edges.push({
        id: `edge-cause-${cause.id}`,
        source: causeNodeId,
        target: bowtie.topEvent.id,
        type: 'straight',
        style: { stroke: '#6b7280', strokeWidth: 2 }
      })

      // Barriers
      cause.barriers.forEach((barrier, bi) => {
        const barrierX = BARRIER_OFFSET_X + bi * 180
        const barrierId = barrier.id

        nodes.push({
          id: barrierId,
          type: 'barrier',
          position: { x: barrierX, y: causeY - NODE_HEIGHT / 2 - 5 },
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

        // Edge: cause to barrier
        edges.push({
          id: `edge-barrier-left-${barrier.id}`,
          source: causeNodeId,
          target: barrierId,
          type: 'straight',
          style: { stroke: '#6b7280', strokeWidth: 2 }
        })

        // Edge: barrier to top event (or next barrier)
        if (bi === cause.barriers.length - 1) {
          edges.push({
            id: `edge-barrier-right-${barrier.id}`,
            source: barrierId,
            target: bowtie.topEvent.id,
            type: 'straight',
            style: { stroke: '#6b7280', strokeWidth: 2 }
          })
        } else {
          const nextBarrier = cause.barriers[bi + 1]
          edges.push({
            id: `edge-barrier-to-next-${barrier.id}`,
            source: barrierId,
            target: nextBarrier.id,
            type: 'straight',
            style: { stroke: '#6b7280', strokeWidth: 2 }
          })
        }
      })
    })

    // Consequences and mitigations
    const totalConsHeight = bowtie.consequences.length > 0
      ? (bowtie.consequences.length - 1) * V_SPACING
      : 0
    const consStartY = TOP_EVENT_Y - totalConsHeight / 2

    bowtie.consequences.forEach((consequence, ci) => {
      const consY = consStartY + ci * V_SPACING
      const consNodeId = consequence.id

      nodes.push({
        id: consNodeId,
        type: 'consequence',
        position: { x: CONSEQUENCE_X, y: consY - NODE_HEIGHT / 2 },
        data: {
          bowtieId: bowtie.id,
          consequenceId: consequence.id,
          label: consequence.label,
          severity: consequence.severity
        },
        draggable: false
      })

      edges.push({
        id: `edge-cons-${consequence.id}`,
        source: bowtie.topEvent.id,
        target: consNodeId,
        type: 'straight',
        style: { stroke: '#6b7280', strokeWidth: 2 }
      })

      // Mitigations
      consequence.mitigations.forEach((mitigation, mi) => {
        const mitX = MITIGATION_OFFSET_X - mi * 180
        const mitId = mitigation.id

        nodes.push({
          id: mitId,
          type: 'mitigation',
          position: { x: mitX, y: consY - NODE_HEIGHT / 2 - 5 },
          data: {
            bowtieId: bowtie.id,
            consequenceId: consequence.id,
            mitigationId: mitigation.id,
            label: mitigation.label,
            effectiveness: mitigation.effectiveness,
            isSECE: mitigation.isSECE,
            seceId: mitigation.seceId
          },
          draggable: false
        })

        if (mi === consequence.mitigations.length - 1) {
          edges.push({
            id: `edge-mit-left-${mitigation.id}`,
            source: bowtie.topEvent.id,
            target: mitId,
            type: 'straight',
            style: { stroke: '#6b7280', strokeWidth: 2 }
          })
        } else {
          const prevMit = consequence.mitigations[mi + 1]
          edges.push({
            id: `edge-mit-prev-${mitigation.id}`,
            source: prevMit.id,
            target: mitId,
            type: 'straight',
            style: { stroke: '#6b7280', strokeWidth: 2 }
          })
        }

        edges.push({
          id: `edge-mit-right-${mitigation.id}`,
          source: mitId,
          target: consNodeId,
          type: 'straight',
          style: { stroke: '#6b7280', strokeWidth: 2 }
        })
      })
    })

    return { nodes, edges }
  }, [bowtie])
}
