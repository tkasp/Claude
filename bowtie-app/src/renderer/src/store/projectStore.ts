import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type {
  Project,
  Bowtie,
  Barrier,
  Consequence,
  Mitigation,
  TitleBlock,
  Attachment,
  AttachmentCategory,
  SelectedNodeType,
  ActiveView
} from './types'

function emptyTitleBlock(): TitleBlock {
  return { documentNumber: '', documentName: '', revBy: '', revDate: '', revNumber: '' }
}

export function createDefaultBowtie(name: string, titleBlock?: TitleBlock): Bowtie {
  return {
    id: uuid(),
    name,
    hazard: { hazardId: '', name: '' },
    topEvent: { id: uuid(), label: 'Top Event' },
    causes: [],
    consequences: [],
    titleBlock: titleBlock ? { ...titleBlock } : emptyTitleBlock()
  }
}

export interface NewProjectInput {
  name: string
  location: string
  description: string
  titleBlock: TitleBlock
}

export function createProjectObject(input: NewProjectInput): Project {
  const bowtie = createDefaultBowtie('Bowtie 1', input.titleBlock)
  return {
    id: uuid(),
    name: input.name,
    location: input.location,
    description: input.description,
    createdAt: new Date().toISOString(),
    titleBlock: { ...input.titleBlock },
    bowties: [bowtie],
    drawings: [],
    hazid: []
  }
}

function regenerateBowtieIds(b: Bowtie): Bowtie {
  const copy: Bowtie = JSON.parse(JSON.stringify(b))
  copy.id = uuid()
  copy.topEvent.id = uuid()
  copy.causes = copy.causes.map((c) => ({
    ...c,
    id: uuid(),
    barriers: c.barriers.map((bar) => ({ ...bar, id: uuid() }))
  }))
  copy.consequences = copy.consequences.map((c) => ({
    ...c,
    id: uuid(),
    mitigations: c.mitigations.map((m) => ({ ...m, id: uuid() }))
  }))
  return copy
}

interface WorkspaceState {
  projects: Project[]
  activeView: ActiveView
  selectedNode: SelectedNodeType | null

  // Workspace / project lifecycle
  addProject: (project: Project) => void
  closeProject: (projectId: string) => void
  loadProject: (project: Project) => void // open from a bundle; replaces if same id
  setProjectFilePath: (projectId: string, path: string) => void
  updateProjectMeta: (
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'location' | 'description'>>
  ) => void
  updateProjectTitleBlock: (projectId: string, updates: Partial<TitleBlock>) => void

  // Navigation
  setActiveView: (view: ActiveView) => void
  openBowtie: (projectId: string, bowtieId: string) => void

  // Attachments
  addAttachment: (projectId: string, attachment: Attachment) => void
  removeAttachment: (projectId: string, category: AttachmentCategory, attachmentId: string) => void

  // Bowtie lifecycle
  addBowtie: (projectId: string) => void
  duplicateBowtie: (projectId: string, bowtieId: string) => void
  deleteBowtie: (projectId: string, bowtieId: string) => void
  renameBowtie: (projectId: string, bowtieId: string, name: string) => void
  updateBowtieTitleBlock: (projectId: string, bowtieId: string, updates: Partial<TitleBlock>) => void
  updateHazard: (projectId: string, bowtieId: string, updates: Partial<Bowtie['hazard']>) => void
  updateTopEvent: (projectId: string, bowtieId: string, label: string) => void

  // Causes / barriers
  addCause: (projectId: string, bowtieId: string) => void
  updateCause: (projectId: string, bowtieId: string, causeId: string, label: string) => void
  deleteCause: (projectId: string, bowtieId: string, causeId: string) => void
  addBarrier: (projectId: string, bowtieId: string, causeId: string) => void
  updateBarrier: (
    projectId: string,
    bowtieId: string,
    causeId: string,
    barrierId: string,
    updates: Partial<Barrier>
  ) => void
  deleteBarrier: (projectId: string, bowtieId: string, causeId: string, barrierId: string) => void

  // Consequences / mitigations
  addConsequence: (projectId: string, bowtieId: string) => void
  updateConsequence: (
    projectId: string,
    bowtieId: string,
    consequenceId: string,
    updates: Partial<Consequence>
  ) => void
  deleteConsequence: (projectId: string, bowtieId: string, consequenceId: string) => void
  addMitigation: (projectId: string, bowtieId: string, consequenceId: string) => void
  updateMitigation: (
    projectId: string,
    bowtieId: string,
    consequenceId: string,
    mitigationId: string,
    updates: Partial<Mitigation>
  ) => void
  deleteMitigation: (
    projectId: string,
    bowtieId: string,
    consequenceId: string,
    mitigationId: string
  ) => void

  // Selection
  setSelectedNode: (node: SelectedNodeType | null) => void

  // Helpers
  getProject: (projectId: string) => Project | undefined
  getBowtie: (projectId: string, bowtieId: string) => Bowtie | undefined
}

export const useProjectStore = create<WorkspaceState>()(
  immer((set, get) => {
    const find = (s: WorkspaceState, projectId: string): Project | undefined =>
      s.projects.find((p) => p.id === projectId)
    const findBowtie = (s: WorkspaceState, projectId: string, bowtieId: string): Bowtie | undefined =>
      find(s, projectId)?.bowties.find((b) => b.id === bowtieId)

    return {
      projects: [],
      activeView: { kind: 'welcome' },
      selectedNode: null,

      addProject: (project) =>
        set((s) => {
          s.projects.push(project)
          const firstBowtie = project.bowties[0]
          s.activeView = firstBowtie
            ? { kind: 'bowtie', projectId: project.id, bowtieId: firstBowtie.id }
            : { kind: 'projectSettings', projectId: project.id }
          s.selectedNode = null
        }),

      closeProject: (projectId) =>
        set((s) => {
          s.projects = s.projects.filter((p) => p.id !== projectId)
          if (
            'projectId' in s.activeView &&
            (s.activeView as { projectId?: string }).projectId === projectId
          ) {
            s.activeView = { kind: 'welcome' }
            s.selectedNode = null
          }
        }),

      loadProject: (project) =>
        set((s) => {
          const idx = s.projects.findIndex((p) => p.id === project.id)
          if (idx >= 0) s.projects[idx] = project
          else s.projects.push(project)
          const firstBowtie = project.bowties[0]
          s.activeView = firstBowtie
            ? { kind: 'bowtie', projectId: project.id, bowtieId: firstBowtie.id }
            : { kind: 'projectSettings', projectId: project.id }
          s.selectedNode = null
        }),

      setProjectFilePath: (projectId, path) =>
        set((s) => {
          const p = find(s, projectId)
          if (p) p.filePath = path
        }),

      updateProjectMeta: (projectId, updates) =>
        set((s) => {
          const p = find(s, projectId)
          if (p) Object.assign(p, updates)
        }),

      updateProjectTitleBlock: (projectId, updates) =>
        set((s) => {
          const p = find(s, projectId)
          if (p) Object.assign(p.titleBlock, updates)
        }),

      setActiveView: (view) =>
        set((s) => {
          s.activeView = view
          s.selectedNode = null
        }),

      openBowtie: (projectId, bowtieId) =>
        set((s) => {
          s.activeView = { kind: 'bowtie', projectId, bowtieId }
          s.selectedNode = null
        }),

      addAttachment: (projectId, attachment) =>
        set((s) => {
          const p = find(s, projectId)
          if (!p) return
          if (attachment.category === 'drawing') p.drawings.push(attachment)
          else p.hazid.push(attachment)
        }),

      removeAttachment: (projectId, category, attachmentId) =>
        set((s) => {
          const p = find(s, projectId)
          if (!p) return
          if (category === 'drawing') p.drawings = p.drawings.filter((a) => a.id !== attachmentId)
          else p.hazid = p.hazid.filter((a) => a.id !== attachmentId)
        }),

      addBowtie: (projectId) =>
        set((s) => {
          const p = find(s, projectId)
          if (!p) return
          const bt = createDefaultBowtie(`Bowtie ${p.bowties.length + 1}`, p.titleBlock)
          p.bowties.push(bt)
          s.activeView = { kind: 'bowtie', projectId, bowtieId: bt.id }
          s.selectedNode = null
        }),

      duplicateBowtie: (projectId, bowtieId) =>
        set((s) => {
          const p = find(s, projectId)
          const src = p?.bowties.find((b) => b.id === bowtieId)
          if (!p || !src) return
          const copy = regenerateBowtieIds(src)
          copy.name = `${src.name} (Copy)`
          const idx = p.bowties.findIndex((b) => b.id === bowtieId)
          p.bowties.splice(idx + 1, 0, copy)
          s.activeView = { kind: 'bowtie', projectId, bowtieId: copy.id }
        }),

      deleteBowtie: (projectId, bowtieId) =>
        set((s) => {
          const p = find(s, projectId)
          if (!p) return
          p.bowties = p.bowties.filter((b) => b.id !== bowtieId)
          if (
            s.activeView.kind === 'bowtie' &&
            s.activeView.bowtieId === bowtieId
          ) {
            const next = p.bowties[0]
            s.activeView = next
              ? { kind: 'bowtie', projectId, bowtieId: next.id }
              : { kind: 'projectSettings', projectId }
          }
        }),

      renameBowtie: (projectId, bowtieId, name) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) bt.name = name
        }),

      updateBowtieTitleBlock: (projectId, bowtieId, updates) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) Object.assign(bt.titleBlock, updates)
        }),

      updateHazard: (projectId, bowtieId, updates) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) Object.assign(bt.hazard, updates)
        }),

      updateTopEvent: (projectId, bowtieId, label) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) bt.topEvent.label = label
        }),

      addCause: (projectId, bowtieId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) bt.causes.push({ id: uuid(), label: 'New Threat', barriers: [] })
        }),

      updateCause: (projectId, bowtieId, causeId, label) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const c = bt?.causes.find((c) => c.id === causeId)
          if (c) c.label = label
        }),

      deleteCause: (projectId, bowtieId, causeId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) bt.causes = bt.causes.filter((c) => c.id !== causeId)
        }),

      addBarrier: (projectId, bowtieId, causeId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const c = bt?.causes.find((c) => c.id === causeId)
          if (c)
            c.barriers.push({
              id: uuid(),
              label: 'New Barrier',
              effectiveness: '',
              effectivenessDescription: '',
              isSECE: false,
              seceId: ''
            })
        }),

      updateBarrier: (projectId, bowtieId, causeId, barrierId, updates) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const c = bt?.causes.find((c) => c.id === causeId)
          const bar = c?.barriers.find((b) => b.id === barrierId)
          if (bar) Object.assign(bar, updates)
        }),

      deleteBarrier: (projectId, bowtieId, causeId, barrierId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const c = bt?.causes.find((c) => c.id === causeId)
          if (c) c.barriers = c.barriers.filter((b) => b.id !== barrierId)
        }),

      addConsequence: (projectId, bowtieId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt)
            bt.consequences.push({ id: uuid(), label: 'New Consequence', severity: '', mitigations: [] })
        }),

      updateConsequence: (projectId, bowtieId, consequenceId, updates) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const con = bt?.consequences.find((c) => c.id === consequenceId)
          if (con) Object.assign(con, updates)
        }),

      deleteConsequence: (projectId, bowtieId, consequenceId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          if (bt) bt.consequences = bt.consequences.filter((c) => c.id !== consequenceId)
        }),

      addMitigation: (projectId, bowtieId, consequenceId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const con = bt?.consequences.find((c) => c.id === consequenceId)
          if (con)
            con.mitigations.push({
              id: uuid(),
              label: 'New Mitigation',
              effectiveness: '',
              effectivenessDescription: '',
              isSECE: false,
              seceId: ''
            })
        }),

      updateMitigation: (projectId, bowtieId, consequenceId, mitigationId, updates) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const con = bt?.consequences.find((c) => c.id === consequenceId)
          const m = con?.mitigations.find((m) => m.id === mitigationId)
          if (m) Object.assign(m, updates)
        }),

      deleteMitigation: (projectId, bowtieId, consequenceId, mitigationId) =>
        set((s) => {
          const bt = findBowtie(s, projectId, bowtieId)
          const con = bt?.consequences.find((c) => c.id === consequenceId)
          if (con) con.mitigations = con.mitigations.filter((m) => m.id !== mitigationId)
        }),

      setSelectedNode: (node) =>
        set((s) => {
          s.selectedNode = node
        }),

      getProject: (projectId) => get().projects.find((p) => p.id === projectId),
      getBowtie: (projectId, bowtieId) =>
        get()
          .projects.find((p) => p.id === projectId)
          ?.bowties.find((b) => b.id === bowtieId)
    }
  })
)
