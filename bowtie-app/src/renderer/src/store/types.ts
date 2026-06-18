export interface TitleBlock {
  documentNumber: string
  documentName: string
  revBy: string
  revDate: string
  revNumber: string
}

export interface Hazard {
  hazardId: string // e.g. "WBT-H.03"
  name: string // e.g. "Lifting operations"
}

export interface BarrierAction {
  id: string
  number: number // unique action number across the project
  text: string
  dueDate: string // ISO date string (yyyy-mm-dd) or ''
}

export interface Barrier {
  id: string
  label: string
  effectiveness: 'Effective' | 'Partially Effective' | 'Ineffective' | ''
  effectivenessDescription: string
  isSECE: boolean
  seceId: string
  actions: BarrierAction[]
}

export type Mitigation = Barrier

export interface Cause {
  id: string
  label: string
  barriers: Barrier[]
}

export interface Consequence {
  id: string
  label: string
  severity: 'Catastrophic' | 'Major' | 'Moderate' | 'Minor' | 'Negligible' | ''
  mitigations: Mitigation[]
}

export interface Bowtie {
  id: string
  name: string
  hazard: Hazard
  topEvent: { id: string; label: string }
  causes: Cause[]
  consequences: Consequence[]
  titleBlock: TitleBlock
}

export type AttachmentCategory = 'drawing' | 'hazid'

export interface Attachment {
  id: string
  name: string // display name (file name)
  ext: string // file extension without dot, e.g. "xlsx", "pdf"
  category: AttachmentCategory
  // When newly added (not yet persisted) the bytes live here as base64.
  // After a project is opened from a bundle, the bytes are extracted to a
  // temp file and tempPath points at it for viewing.
  dataBase64?: string
  tempPath?: string
}

export interface Project {
  id: string
  name: string
  location: string
  description: string
  createdAt: string
  titleBlock: TitleBlock
  bowties: Bowtie[]
  drawings: Attachment[]
  hazid: Attachment[]
  filePath?: string // bundle path on disk
}

// What the main editor area is currently showing
export type ActiveView =
  | { kind: 'welcome' }
  | { kind: 'bowtie'; projectId: string; bowtieId: string }
  | { kind: 'projectSettings'; projectId: string }
  | { kind: 'bowtieSettings'; projectId: string; bowtieId: string }
  | { kind: 'attachment'; projectId: string; attachmentId: string }

// Which node is selected in the bowtie editor (for the properties panel)
export type SelectedNodeType =
  | { kind: 'hazard'; bowtieId: string }
  | { kind: 'topEvent'; bowtieId: string }
  | { kind: 'cause'; bowtieId: string; causeId: string }
  | { kind: 'consequence'; bowtieId: string; consequenceId: string }
  | { kind: 'barrier'; bowtieId: string; causeId: string; barrierId: string }
  | { kind: 'mitigation'; bowtieId: string; consequenceId: string; mitigationId: string }
