import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type { Project, Bowtie, Cause, Consequence, Barrier, Mitigation, SelectedNodeType } from './types'

function createDefaultBowtie(name: string): Bowtie {
  return {
    id: uuid(),
    name,
    topEvent: { id: uuid(), label: 'Top Event' },
    causes: [],
    consequences: [],
    titleBlock: {
      documentNumber: '',
      documentName: '',
      revBy: '',
      revDate: '',
      revNumber: ''
    }
  }
}

function createDefaultProject(): Project {
  const bowtie = createDefaultBowtie('Bowtie 1')
  return {
    id: uuid(),
    name: 'New Project',
    createdAt: new Date().toISOString(),
    bowties: [bowtie]
  }
}

interface ProjectState {
  project: Project
  activeBowtieId: string | null
  selectedNode: SelectedNodeType | null

  // Project actions
  setProjectName: (name: string) => void
  setProjectFilePath: (path: string) => void
  loadProject: (project: Project) => void

  // Bowtie actions
  setActiveBowtie: (id: string) => void
  addBowtie: () => void
  duplicateBowtie: (id: string) => void
  deleteBowtie: (id: string) => void
  renameBowtie: (id: string, name: string) => void
  updateTitleBlock: (bowtieId: string, updates: Partial<Bowtie['titleBlock']>) => void
  updateTopEvent: (bowtieId: string, label: string) => void

  // Cause actions
  addCause: (bowtieId: string) => void
  updateCause: (bowtieId: string, causeId: string, label: string) => void
  deleteCause: (bowtieId: string, causeId: string) => void

  // Consequence actions
  addConsequence: (bowtieId: string) => void
  updateConsequence: (bowtieId: string, consequenceId: string, updates: Partial<Consequence>) => void
  deleteConsequence: (bowtieId: string, consequenceId: string) => void

  // Barrier actions
  addBarrier: (bowtieId: string, causeId: string) => void
  updateBarrier: (bowtieId: string, causeId: string, barrierId: string, updates: Partial<Barrier>) => void
  deleteBarrier: (bowtieId: string, causeId: string, barrierId: string) => void

  // Mitigation actions
  addMitigation: (bowtieId: string, consequenceId: string) => void
  updateMitigation: (bowtieId: string, consequenceId: string, mitigationId: string, updates: Partial<Mitigation>) => void
  deleteMitigation: (bowtieId: string, consequenceId: string, mitigationId: string) => void

  // Selection
  setSelectedNode: (node: SelectedNodeType | null) => void

  // Helpers
  getActiveBowtie: () => Bowtie | undefined
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => {
    const project = createDefaultProject()
    return {
      project,
      activeBowtieId: project.bowties[0]?.id ?? null,
      selectedNode: null,

      setProjectName: (name) =>
        set((s) => { s.project.name = name }),

      setProjectFilePath: (path) =>
        set((s) => { s.project.filePath = path }),

      loadProject: (proj) =>
        set((s) => {
          s.project = proj
          s.activeBowtieId = proj.bowties[0]?.id ?? null
          s.selectedNode = null
        }),

      setActiveBowtie: (id) =>
        set((s) => {
          s.activeBowtieId = id
          s.selectedNode = null
        }),

      addBowtie: () =>
        set((s) => {
          const bt = createDefaultBowtie(`Bowtie ${s.project.bowties.length + 1}`)
          s.project.bowties.push(bt)
          s.activeBowtieId = bt.id
          s.selectedNode = null
        }),

      duplicateBowtie: (id) =>
        set((s) => {
          const src = s.project.bowties.find((b) => b.id === id)
          if (!src) return
          const copy: Bowtie = JSON.parse(JSON.stringify(src))
          copy.id = uuid()
          copy.name = `${src.name} (Copy)`
          // Regenerate all IDs
          copy.topEvent.id = uuid()
          copy.causes = copy.causes.map((c) => ({
            ...c,
            id: uuid(),
            barriers: c.barriers.map((b) => ({ ...b, id: uuid() }))
          }))
          copy.consequences = copy.consequences.map((c) => ({
            ...c,
            id: uuid(),
            mitigations: c.mitigations.map((m) => ({ ...m, id: uuid() }))
          }))
          s.project.bowties.push(copy)
          s.activeBowtieId = copy.id
        }),

      deleteBowtie: (id) =>
        set((s) => {
          const idx = s.project.bowties.findIndex((b) => b.id === id)
          if (idx === -1) return
          s.project.bowties.splice(idx, 1)
          if (s.activeBowtieId === id) {
            s.activeBowtieId = s.project.bowties[0]?.id ?? null
          }
        }),

      renameBowtie: (id, name) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === id)
          if (bt) bt.name = name
        }),

      updateTitleBlock: (bowtieId, updates) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (bt) Object.assign(bt.titleBlock, updates)
        }),

      updateTopEvent: (bowtieId, label) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (bt) bt.topEvent.label = label
        }),

      addCause: (bowtieId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (!bt) return
          bt.causes.push({ id: uuid(), label: 'New Cause', barriers: [] })
        }),

      updateCause: (bowtieId, causeId, label) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cause = bt?.causes.find((c) => c.id === causeId)
          if (cause) cause.label = label
        }),

      deleteCause: (bowtieId, causeId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (!bt) return
          bt.causes = bt.causes.filter((c) => c.id !== causeId)
        }),

      addConsequence: (bowtieId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (!bt) return
          bt.consequences.push({ id: uuid(), label: 'New Consequence', severity: '', mitigations: [] })
        }),

      updateConsequence: (bowtieId, consequenceId, updates) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cons = bt?.consequences.find((c) => c.id === consequenceId)
          if (cons) Object.assign(cons, updates)
        }),

      deleteConsequence: (bowtieId, consequenceId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          if (!bt) return
          bt.consequences = bt.consequences.filter((c) => c.id !== consequenceId)
        }),

      addBarrier: (bowtieId, causeId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cause = bt?.causes.find((c) => c.id === causeId)
          if (!cause) return
          cause.barriers.push({ id: uuid(), label: 'New Barrier', effectiveness: '', effectivenessDescription: '', isSECE: false, seceId: '' })
        }),

      updateBarrier: (bowtieId, causeId, barrierId, updates) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cause = bt?.causes.find((c) => c.id === causeId)
          const barrier = cause?.barriers.find((b) => b.id === barrierId)
          if (barrier) Object.assign(barrier, updates)
        }),

      deleteBarrier: (bowtieId, causeId, barrierId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cause = bt?.causes.find((c) => c.id === causeId)
          if (!cause) return
          cause.barriers = cause.barriers.filter((b) => b.id !== barrierId)
        }),

      addMitigation: (bowtieId, consequenceId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cons = bt?.consequences.find((c) => c.id === consequenceId)
          if (!cons) return
          cons.mitigations.push({ id: uuid(), label: 'New Mitigation', effectiveness: '', effectivenessDescription: '', isSECE: false, seceId: '' })
        }),

      updateMitigation: (bowtieId, consequenceId, mitigationId, updates) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cons = bt?.consequences.find((c) => c.id === consequenceId)
          const mit = cons?.mitigations.find((m) => m.id === mitigationId)
          if (mit) Object.assign(mit, updates)
        }),

      deleteMitigation: (bowtieId, consequenceId, mitigationId) =>
        set((s) => {
          const bt = s.project.bowties.find((b) => b.id === bowtieId)
          const cons = bt?.consequences.find((c) => c.id === consequenceId)
          if (!cons) return
          cons.mitigations = cons.mitigations.filter((m) => m.id !== mitigationId)
        }),

      setSelectedNode: (node) =>
        set((s) => { s.selectedNode = node }),

      getActiveBowtie: () => {
        const { project, activeBowtieId } = get()
        return project.bowties.find((b) => b.id === activeBowtieId)
      }
    }
  })
)
