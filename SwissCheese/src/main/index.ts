import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { generateExcel } from './export/excelExporter'
import { parseHazidExcel } from './export/hazidParser'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#ffffff',
    title: 'Swiss Cheese',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const DRAWING_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'dwg', 'dxf', 'tif', 'tiff', 'svg', 'docx']
const HAZID_EXTS = ['xlsx', 'xls', 'xlsm', 'csv']

function sanitize(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-')
}

// Save the entire project (JSON, with embedded base64 attachments) as a .bowtie bundle.
ipcMain.handle('save-project', async (_e, json: string, existingPath?: string) => {
  let target = existingPath
  if (!target) {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Project',
      defaultPath: 'facility.bowtie',
      filters: [{ name: 'Bowtie Project', extensions: ['bowtie'] }]
    })
    if (canceled || !filePath) return { success: false }
    target = filePath
  }
  await fs.writeFile(target, json, 'utf-8')
  return { success: true, filePath: target }
})

// Open a .bowtie bundle and return its JSON contents.
ipcMain.handle('open-project', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Project',
    filters: [{ name: 'Bowtie Project', extensions: ['bowtie', 'json'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return { success: false }
  const data = await fs.readFile(filePaths[0], 'utf-8')
  return { success: true, data }
})

// Let the user pick a file to embed as a drawing or HAZID attachment.
ipcMain.handle('pick-attachment', async (_e, category: 'drawing' | 'hazid') => {
  const exts = category === 'hazid' ? HAZID_EXTS : DRAWING_EXTS
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: category === 'hazid' ? 'Add HAZID File' : 'Add Drawing',
    filters: [{ name: category === 'hazid' ? 'HAZID files' : 'Drawings', extensions: exts }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return null
  const filePath = filePaths[0]
  const buf = await fs.readFile(filePath)
  const name = filePath.split(/[/\\]/).pop() ?? 'file'
  const ext = (name.split('.').pop() ?? '').toLowerCase()
  return { id: randomUUID(), name, ext, dataBase64: buf.toString('base64') }
})

// Write an embedded attachment to a temp file and open it in the default app.
ipcMain.handle('open-attachment', async (_e, payload: { name: string; ext: string; dataBase64: string }) => {
  const dir = join(tmpdir(), 'bowtie-attachments')
  await fs.mkdir(dir, { recursive: true })
  const target = join(dir, sanitize(payload.name))
  await fs.writeFile(target, Buffer.from(payload.dataBase64, 'base64'))
  await shell.openPath(target)
  return { success: true }
})

// Save a PDF report (base64) generated in the renderer to a chosen location.
ipcMain.handle('save-pdf', async (_e, base64: string, defaultName: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save PDF Report',
    defaultPath: `${sanitize(defaultName)}.pdf`,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  })
  if (canceled || !filePath) return { success: false }
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
  shell.showItemInFolder(filePath)
  return { success: true, filePath }
})

// Export the active bowtie PNG (already composed with the title block) to disk.
ipcMain.handle('export-png', async (_e, dataUrl: string, name: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export Bowtie PNG',
    defaultPath: `${sanitize(name)}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  })
  if (canceled || !filePath) return { success: false }
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
  shell.showItemInFolder(filePath)
  return { success: true, filePath }
})

// Parse a HAZID Excel file (base64) and return its rows for the import modal.
ipcMain.handle('parse-hazid', async (_e, base64: string) => {
  try {
    const result = await parseHazidExcel(base64)
    return { success: true, result }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// Export the project's barriers & mitigations to an Excel report.
ipcMain.handle('export-excel', async (_e, projectJson: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export to Excel',
    defaultPath: 'bowtie-barriers.xlsx',
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
  })
  if (canceled || !filePath) return { success: false }
  const project = JSON.parse(projectJson)
  const buffer = await generateExcel(project)
  await fs.writeFile(filePath, buffer)
  shell.showItemInFolder(filePath)
  return { success: true, filePath }
})
