// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — jspdf-autotable augments jsPDF at runtime
import autoTable from 'jspdf-autotable'
import { jsPDF } from 'jspdf'
import type { Project, Bowtie } from '../store/types'
import { severityLabel } from './severity'

const BLUE: [number, number, number] = [37, 99, 235]
const RED: [number, number, number] = [220, 38, 38]
const AMBER: [number, number, number] = [245, 158, 11]
const SLATE: [number, number, number] = [15, 23, 42]
const VIOLET: [number, number, number] = [124, 58, 237]
const LIGHT: [number, number, number] = [244, 245, 247]

// Reads a PNG data-URL's intrinsic pixel size for aspect-ratio fitting.
function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.width, h: img.height })
    img.onerror = reject
    img.src = dataUrl
  })
}

// Draws the Swiss-Cheese vector logo at (x, y) with the given box size (mm).
function drawLogo(doc: jsPDF, x: number, y: number, s: number): void {
  const p = (v: number): number => v / 48 * s // map 48-unit viewBox to s mm
  // Left lobe
  doc.setFillColor(...BLUE)
  doc.triangle(x + p(7), y + p(11), x + p(23), y + p(24), x + p(7), y + p(37), 'F')
  // Right lobe
  doc.setFillColor(...RED)
  doc.triangle(x + p(41), y + p(11), x + p(25), y + p(24), x + p(41), y + p(37), 'F')
  // Holes
  doc.setFillColor(...LIGHT)
  doc.circle(x + p(11.5), y + p(19), p(1.9), 'F')
  doc.circle(x + p(11), y + p(29), p(1.5), 'F')
  doc.circle(x + p(36.5), y + p(19), p(1.9), 'F')
  doc.circle(x + p(37), y + p(29), p(1.5), 'F')
  // Centre event
  doc.setFillColor(...SLATE)
  doc.circle(x + p(24), y + p(24), p(5), 'F')
  doc.setFillColor(...AMBER)
  doc.circle(x + p(24), y + p(24), p(2.4), 'F')
}

function pageW(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth()
}
function pageH(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight()
}

function addPageHeader(doc: jsPDF, title: string, subtitle = ''): void {
  const W = pageW(doc)
  doc.setFillColor(...SLATE)
  doc.rect(0, 0, W, 16, 'F')
  drawLogo(doc, 6, 2.5, 11)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Swiss-Cheese', 20, 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(title, W / 2, 8, { align: 'center' })
  if (subtitle) {
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(subtitle, W / 2, 13, { align: 'center' })
  }
  doc.setTextColor(0, 0, 0)
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const W = pageW(doc)
  const H = pageH(doc)
  doc.setDrawColor(203, 213, 225)
  doc.line(10, H - 10, W - 10, H - 10)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Page ${pageNum} of ${totalPages}`, W / 2, H - 5, { align: 'center' })
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - 10, H - 5, { align: 'right' })
}

function addCoverPage(doc: jsPDF, project: Project): void {
  const W = pageW(doc)
  const H = pageH(doc)

  doc.setFillColor(...SLATE)
  doc.rect(0, 0, W, 90, 'F')

  // Logo, centred
  drawLogo(doc, W / 2 - 16, 18, 32)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(148, 163, 184)
  doc.text('SWISS-CHEESE', W / 2, 62, { align: 'center' })

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(project.name, W / 2, 76, { align: 'center', maxWidth: W - 30 })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Bowtie Risk Analysis Report', W / 2, 85, { align: 'center' })

  // Details
  let y = 108
  const kv = (label: string, value: string): void => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SLATE)
    doc.text(label, 18, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(value || '—', 70, y, { maxWidth: W - 90 })
    y += 9
  }
  kv('Facility:', project.name)
  kv('Location:', project.location)
  kv('Description:', project.description)
  kv('Bowties:', String(project.bowties.length))
  kv('Date:', new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }))

  // Default title block
  y += 6
  const tb = project.titleBlock
  autoTable(doc, {
    startY: y,
    head: [['Document Number', 'Document Name', 'Rev By', 'Rev Date', 'Rev #']],
    body: [[tb.documentNumber || '—', tb.documentName || '—', tb.revBy || '—', tb.revDate || '—', tb.revNumber || '—']],
    theme: 'grid',
    headStyles: { fillColor: SLATE, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 18, right: 18 }
  })

  doc.setFillColor(...AMBER)
  doc.rect(0, H - 8, W, 8, 'F')
}

// Landscape full-page bowtie diagram, aspect-ratio preserved + properties strip.
async function addBowtiePngPage(doc: jsPDF, project: Project, bowtie: Bowtie, dataUrl: string): Promise<void> {
  doc.addPage('tabloid', 'landscape')
  const W = pageW(doc)
  const H = pageH(doc)
  addPageHeader(doc, `Bowtie: ${bowtie.name}`, project.name)

  // Properties strip under the header
  let stripY = 20
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLUE)
  doc.text(`Hazard ${bowtie.hazard.hazardId}`, 10, stripY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  doc.text(bowtie.hazard.name || '—', 45, stripY + 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE)
  doc.text('Top Event:', W / 2 - 40, stripY + 4)
  doc.setFont('helvetica', 'normal')
  doc.text(bowtie.topEvent.label || '—', W / 2 - 18, stripY + 4, { maxWidth: W / 2 })
  stripY += 8

  // Image area
  const imgTop = stripY
  const maxW = W - 20
  const maxH = H - imgTop - 14
  let drawW = maxW
  let drawH = maxH
  try {
    const { w, h } = await imageSize(dataUrl)
    const ar = w / h
    drawW = maxW
    drawH = maxW / ar
    if (drawH > maxH) {
      drawH = maxH
      drawW = maxH * ar
    }
  } catch {
    /* fall back to box dims */
  }
  const imgX = (W - drawW) / 2
  doc.addImage(dataUrl, 'PNG', imgX, imgTop, drawW, drawH, undefined, 'FAST')
}

// Combined barriers & mitigations table across all bowties (portrait).
function addControlsPage(doc: jsPDF, project: Project): void {
  doc.addPage('tabloid', 'portrait')
  addPageHeader(doc, 'Barriers & Mitigations', project.name)

  const rows: Array<[string, string, string, string, string, string, string, string]> = []
  for (const bt of project.bowties) {
    for (const cause of bt.causes) {
      for (const b of cause.barriers) {
        rows.push([
          bt.name,
          'Barrier',
          cause.label,
          b.label,
          b.effectiveness || '—',
          b.isSECE ? (b.seceId ? `SECE #${b.seceId}` : 'SECE') : '—',
          '—',
          b.effectivenessDescription || '—'
        ])
      }
    }
    for (const con of bt.consequences) {
      for (const m of con.mitigations) {
        rows.push([
          bt.name,
          'Mitigation',
          con.label,
          m.label,
          m.effectiveness || '—',
          m.isSECE ? (m.seceId ? `SECE #${m.seceId}` : 'SECE') : '—',
          severityLabel(con.severity) || '—',
          m.effectivenessDescription || '—'
        ])
      }
    }
  }

  autoTable(doc, {
    startY: 20,
    head: [['Bowtie', 'Type', 'Threat / Consequence', 'Barrier / Mitigation', 'Effectiveness', 'SECE', 'Severity', 'Effectiveness Basis']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—', '—', '—', 'No barriers or mitigations recorded']],
    theme: 'striped',
    headStyles: { fillColor: SLATE, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 7: { cellWidth: 55 } },
    margin: { left: 10, right: 10 }
  })
}

// Combined actions register across all bowties (portrait).
function addActionsPage(doc: jsPDF, project: Project): void {
  doc.addPage('tabloid', 'portrait')
  addPageHeader(doc, 'Actions Register', project.name)

  const rows: string[][] = []
  for (const bt of project.bowties) {
    for (const cause of bt.causes) {
      for (const b of cause.barriers) {
        for (const a of b.actions ?? []) {
          rows.push([String(a.number), bt.name, 'Barrier', cause.label, b.label, a.text, a.dueDate || '—'])
        }
      }
    }
    for (const con of bt.consequences) {
      for (const m of con.mitigations) {
        for (const a of m.actions ?? []) {
          rows.push([String(a.number), bt.name, 'Mitigation', con.label, m.label, a.text, a.dueDate || '—'])
        }
      }
    }
  }

  autoTable(doc, {
    startY: 20,
    head: [['#', 'Bowtie', 'Type', 'Threat / Consequence', 'Barrier / Mitigation', 'Action', 'Due Date']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—', 'No actions recorded', '—']],
    theme: 'striped',
    headStyles: { fillColor: VIOLET, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 5: { cellWidth: 70 } },
    margin: { left: 10, right: 10 }
  })
}

export interface ReportProgress {
  step: string
  current: number
  total: number
}

export async function generatePdfReport(
  project: Project,
  captureBowtie: (bowtieId: string) => Promise<string | null>,
  onProgress: (p: ReportProgress) => void
): Promise<string> {
  // Tabloid/Ledger paper (11×17"). Portrait by default; bowtie pages landscape.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'tabloid' })

  const total = project.bowties.length + 3
  onProgress({ step: 'Building cover page…', current: 0, total })
  addCoverPage(doc, project)

  // One landscape diagram page per bowtie (no per-bowtie tables).
  for (let i = 0; i < project.bowties.length; i++) {
    const bowtie = project.bowties[i]
    onProgress({ step: `Capturing "${bowtie.name}"…`, current: i + 1, total })
    const png = await captureBowtie(bowtie.id)
    if (png) await addBowtiePngPage(doc, project, bowtie, png)
  }

  onProgress({ step: 'Building barriers & mitigations…', current: project.bowties.length + 1, total })
  addControlsPage(doc, project)

  onProgress({ step: 'Building actions register…', current: project.bowties.length + 2, total })
  addActionsPage(doc, project)

  // Footers on every page (1-indexed).
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  onProgress({ step: 'Finalising…', current: total, total })
  return doc.output('datauristring').split(',')[1]
}
