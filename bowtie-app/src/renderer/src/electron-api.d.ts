export interface PickedAttachment {
  id: string
  name: string
  ext: string
  dataBase64: string
}

export interface HazidRow {
  rowIndex: number
  hazardId: string
  hazard: string
  node: string
  topEvent: string
  causes: string
  consequences: string
  riskRating: string
  rawValues: Record<string, string>
}

export interface HazidColumnMapping {
  hazardId: number | null
  hazard: number | null
  node: number | null
  topEvent: number | null
  causes: number | null
  consequences: number | null
  riskRating: number | null
}

export interface HazidParseResult {
  headers: string[]
  rows: HazidRow[]
  columnMapping: HazidColumnMapping
}

export interface ElectronAPI {
  saveProject: (
    json: string,
    existingPath?: string
  ) => Promise<{ success: boolean; filePath?: string }>
  openProject: () => Promise<{ success: boolean; data?: string }>
  pickAttachment: (category: 'drawing' | 'hazid') => Promise<PickedAttachment | null>
  openAttachment: (payload: {
    name: string
    ext: string
    dataBase64: string
  }) => Promise<{ success: boolean }>
  exportPng: (dataUrl: string, name: string) => Promise<{ success: boolean; filePath?: string }>
  exportExcel: (json: string) => Promise<{ success: boolean; filePath?: string }>
  parseHazid: (base64: string) => Promise<{ success: boolean; result?: HazidParseResult; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
