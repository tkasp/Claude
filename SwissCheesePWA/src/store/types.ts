export interface TitleBlock {
  documentNumber: string
  documentName: string
  revBy: string
  revDate: string
  revNumber: string
}

export interface Hazard {
  hazardId: string
  name: string
}

export interface BarrierAction {
  id: string
  number: number
  text: string
  dueDate: string
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
  manualY?: number
}

export interface Consequence {
  id: string
  label: string
  severity: 'Catastrophic' | 'Major' | 'Moderate' | 'Minor' | 'Negligible' | ''
  mitigations: Mitigation[]
  manualY?: number
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
  name: string
  ext: string
  category: AttachmentCategory
  dataBase64?: string
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
  filePath?: string
}

export type ActiveView =
  | { kind: 'welcome' }
  | { kind: 'bowtie'; projectId: string; bowtieId: string }
  | { kind: 'projectSettings'; projectId: string }
  | { kind: 'bowtieSettings'; projectId: string; bowtieId: string }

export type SelectedNodeType =
  | { kind: 'hazard'; bowtieId: string }
  | { kind: 'topEvent'; bowtieId: string }
  | { kind: 'cause'; bowtieId: string; causeId: string }
  | { kind: 'consequence'; bowtieId: string; consequenceId: string }
  | { kind: 'barrier'; bowtieId: string; causeId: string; barrierId: string }
  | { kind: 'mitigation'; bowtieId: string; consequenceId: string; mitigationId: string }
