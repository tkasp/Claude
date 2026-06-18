import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { generateExcel } from './export/excelExporter'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    title: 'Bowtie Risk Diagram'
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

// Save project
ipcMain.handle('save-project', async (_event, projectJson: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save Project',
    defaultPath: 'bowtie-project.json',
    filters: [{ name: 'Bowtie Project', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { success: false }
  await fs.writeFile(filePath, projectJson, 'utf-8')
  return { success: true, filePath }
})

// Open project
ipcMain.handle('open-project', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Project',
    filters: [{ name: 'Bowtie Project', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return { success: false }
  const data = await fs.readFile(filePaths[0], 'utf-8')
  return { success: true, data }
})

// Export single PNG
ipcMain.handle('export-png', async (_event, dataUrl: string, name: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export PNG',
    defaultPath: `${name}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  })
  if (canceled || !filePath) return { success: false }
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
  shell.showItemInFolder(filePath)
  return { success: true, filePath }
})

// Export all bowties as PNGs to a folder
ipcMain.handle('export-all-pngs', async (_event, files: { name: string; dataUrl: string }[]) => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Choose Export Folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (canceled || filePaths.length === 0) return { success: false }
  const folder = filePaths[0]
  for (const file of files) {
    const safe = file.name.replace(/[/\\?%*:|"<>]/g, '-')
    const base64 = file.dataUrl.replace(/^data:image\/png;base64,/, '')
    await fs.writeFile(join(folder, `${safe}.png`), Buffer.from(base64, 'base64'))
  }
  if (files.length > 0) {
    shell.showItemInFolder(join(folder, files[0].name.replace(/[/\\?%*:|"<>]/g, '-') + '.png'))
  }
  return { success: true }
})

// Export Excel
ipcMain.handle('export-excel', async (_event, projectJson: string) => {
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
