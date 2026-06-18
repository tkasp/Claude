import { contextBridge, ipcRenderer } from 'electron'

// Exposed as window.electronAPI to match renderer expectations
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (json: string) =>
    ipcRenderer.invoke('save-project', json),
  openProject: () =>
    ipcRenderer.invoke('open-project'),
  exportPng: (dataUrl: string, name: string) =>
    ipcRenderer.invoke('export-png', dataUrl, name),
  exportAllPngs: (files: { name: string; dataUrl: string }[]) =>
    ipcRenderer.invoke('export-all-pngs', files),
  exportExcel: (json: string) =>
    ipcRenderer.invoke('export-excel', json),
  showFile: (filePath: string) =>
    ipcRenderer.invoke('show-file', filePath)
})
