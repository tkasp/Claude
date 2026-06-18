import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Save the whole project (JSON with embedded attachments) as a single bundle file.
  saveProject: (json: string, existingPath?: string) =>
    ipcRenderer.invoke('save-project', json, existingPath),
  // Open a project bundle; returns parsed-ready JSON string.
  openProject: () => ipcRenderer.invoke('open-project'),
  // Pick a file to attach; returns { id, name, ext, dataBase64 } or null.
  pickAttachment: (category: 'drawing' | 'hazid') =>
    ipcRenderer.invoke('pick-attachment', category),
  // Write an attachment to a temp file and open it in the system default app.
  openAttachment: (payload: { name: string; ext: string; dataBase64: string }) =>
    ipcRenderer.invoke('open-attachment', payload),
  // Export the active bowtie PNG (data URL) to a chosen path.
  exportPng: (dataUrl: string, name: string) => ipcRenderer.invoke('export-png', dataUrl, name),
  // Export the project's barriers & mitigations to an Excel report.
  exportExcel: (json: string) => ipcRenderer.invoke('export-excel', json)
})
