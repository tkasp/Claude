export interface PickedAttachment {
  id: string
  name: string
  ext: string
  dataBase64: string
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
