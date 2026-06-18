import { generateExcel } from './excelExporter'
import { parseHazidExcel, type HazidParseResult } from './hazidParser'
import type { Project } from '../store/types'
import { v4 as uuid } from 'uuid'

// Module-level map: projectId → FileSystemFileHandle (not serializable, kept outside Zustand)
export const projectFileHandles = new Map<string, FileSystemFileHandle>()

// ── Project save / open ──────────────────────────────────────────────────────

export async function saveProject(
  json: string,
  projectId: string
): Promise<{ success: boolean; fileName?: string }> {
  try {
    let handle = projectFileHandles.get(projectId)
    if (!handle) {
      handle = await (window as any).showSaveFilePicker({
        suggestedName: 'project.bowtie',
        types: [{ description: 'Bowtie Project', accept: { 'application/json': ['.bowtie'] } }]
      }) as FileSystemFileHandle
      projectFileHandles.set(projectId, handle)
    }
    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()
    return { success: true, fileName: handle.name }
  } catch (e: any) {
    if (e?.name === 'AbortError') return { success: false }
    throw e
  }
}

export async function openProject(): Promise<{ success: boolean; data?: string; handle?: FileSystemFileHandle }> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'Bowtie Project', accept: { 'application/json': ['.bowtie', '.json'] } }],
      multiple: false
    }) as FileSystemFileHandle[]
    const file = await handle.getFile()
    const data = await file.text()
    return { success: true, data, handle }
  } catch (e: any) {
    if (e?.name === 'AbortError') return { success: false }
    throw e
  }
}

// ── Attachment pick / open ───────────────────────────────────────────────────

const DRAWING_TYPES = [{
  description: 'Drawing / Document',
  accept: { '*/*': ['.pdf', '.png', '.jpg', '.jpeg', '.svg', '.tif', '.tiff', '.docx', '.dwg', '.dxf'] as `.${string}`[] }
}]
const HAZID_TYPES = [{
  description: 'HAZID Spreadsheet',
  accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls', '.xlsm', '.csv'] as `.${string}`[] }
}]

export async function pickAttachment(
  category: 'drawing' | 'hazid'
): Promise<{ id: string; name: string; ext: string; dataBase64: string } | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: category === 'drawing' ? DRAWING_TYPES : HAZID_TYPES,
      multiple: false
    }) as FileSystemFileHandle[]
    const file: File = await handle.getFile()
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    const dataBase64 = btoa(binary)
    const ext = file.name.split('.').pop() ?? ''
    return { id: uuid(), name: file.name, ext, dataBase64 }
  } catch (e: any) {
    if (e?.name === 'AbortError') return null
    throw e
  }
}

export function openAttachment({ name, ext, dataBase64 }: { name: string; ext: string; dataBase64: string }): void {
  const byteChars = atob(dataBase64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── PNG export ───────────────────────────────────────────────────────────────

export function exportPng(dataUrl: string, name: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${name}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── PDF export ───────────────────────────────────────────────────────────────

export function savePdf(base64: string, defaultName: string): void {
  const byteChars = atob(base64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultName.endsWith('.pdf') ? defaultName : `${defaultName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── Excel export ─────────────────────────────────────────────────────────────

export async function exportExcel(project: Project): Promise<void> {
  const buf = await generateExcel(project)
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name} - Barriers & Mitigations.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── HAZID parse ───────────────────────────────────────────────────────────────

export async function parseHazid(
  base64: string
): Promise<{ success: boolean; result?: HazidParseResult; error?: string }> {
  try {
    const result = await parseHazidExcel(base64)
    return { success: true, result }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
