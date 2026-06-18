export interface TitleBlock {
  documentNumber: string
  documentName: string
  revBy: string
  revDate: string
  revNumber: string
}

export interface Barrier {
  id: string
  label: string
  effectiveness: 'Effective' | 'Partially Effective' | 'Ineffective' | ''
  effectivenessDescription: string
  isSECE: boolean
  seceId: string
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
  topEvent: { id: string; label: string }
  causes: Cause[]
  consequences: Consequence[]
  titleBlock: TitleBlock
}

export interface Project {
  id: string
  name: string
  createdAt: string
  bowties: Bowtie[]
}

// Selected node info for editing panel
export type SelectedNodeType =
  | { kind: 'topEvent'; bowtieId: string }
  | { kind: 'cause'; bowtieId: string; causeId: string }
  | { kind: 'consequence'; bowtieId: string; consequenceId: string }
  | { kind: 'barrier'; bowtieId: string; causeId: string; barrierId: string }
  | { kind: 'mitigation'; bowtieId: string; consequenceId: string; mitigationId: string }
