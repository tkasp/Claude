// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — jspdf-autotable augments jsPDF at runtime
import autoTable from 'jspdf-autotable'
import { jsPDF } from 'jspdf'
import type { Project, Bowtie } from '../store/types'
import { severityLabel } from './severity'

const BLUE = [29, 78, 216] as [number, number, number]
const RED = [185, 28, 28] as [number, number, number]
const ORANGE = [249, 115, 22] as [number, number, number]
const SLATE = [30, 41, 59] as [number, number, number]
const LIGHT = [248, 250, 252] as [number, number, number]

// Draws the report page header strip (blue bar + title)
function addPageHeader(doc: jsPDF, title: string, subtitle = ''): void {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...SLATE)
  doc.rect(0, 0, W, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Swiss-Cheese', 8, 9)
  doc.setFont('helvetica', 'normal')
  doc.text(title, W / 2, 9, { align: 'center' })
  if (subtitle) {
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(subtitle, W / 2, 13, { align: 'center' })
  }
  doc.setTextColor(0, 0, 0)
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setDrawColor(203, 213, 225)
  doc.line(8, H - 8, W - 8, H - 8)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(`Page ${pageNum} of ${totalPages}`, W / 2, H - 4, { align: 'center' })
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - 8, H - 4, { align: 'right' })
}

// Cover page
function addCoverPage(doc: jsPDF, project: Project): void {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Background header block
  doc.setFillColor(...SLATE)
  doc.rect(0, 0, W, 60, 'F')

  // App name
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(148, 163, 184)
  doc.text('SWISS-CHEESE', W / 2, 20, { align: 'center' })

  // Project name
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(project.name, W / 2, 36, { align: 'center', maxWidth: W - 20 })

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Bowtie Risk Analysis Report', W / 2, 48, { align: 'center' })

  // Details table
  let y = 72
  const kv = (label: string, value: string): void => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SLATE)
    doc.text(label, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(value || '—', 60, y)
    y += 8
  }

  kv('Facility:', project.name)
  kv('Location:', project.location)
  kv('Description:', project.description)
  kv('Bowties:', String(project.bowties.length))
  kv('Date:', new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }))

  // Title block box
  if (project.titleBlock) {
    y += 6
    doc.setFillColor(...LIGHT)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(12, y, W - 24, 38, 2, 2, 'FD')
    y += 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SLATE)
    doc.text('DEFAULT TITLE BLOCK', 18, y)
    y += 7
    const tb = project.titleBlock
    const tbRows = [
      ['Document Number', tb.documentNumber],
      ['Document Name', tb.documentName],
      ['Rev By', tb.revBy],
      ['Rev Date', tb.revDate],
      ['Rev #', tb.revNumber]
    ]
    const colW = (W - 28) / 2
    let col = 0
    let rowY = y
    for (const [lbl, val] of tbRows) {
      const x = 18 + col * (colW + 4)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(lbl.toUpperCase(), x, rowY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(val || '—', x, rowY + 5)
      col++
      if (col === 2) {
        col = 0
        rowY += 13
      }
    }
  }

  // Orange bowtie accent bar at bottom
  doc.setFillColor(...ORANGE)
  doc.rect(0, H - 6, W, 6, 'F')
}

// One bowtie details page (text properties — PNG is on separate page)
function addBowtiePropertiesPage(doc: jsPDF, project: Project, bowtie: Bowtie): void {
  doc.addPage('a4', 'portrait')
  addPageHeader(doc, `Bowtie: ${bowtie.name}`, project.name)

  let y = 22

  // Hazard info
  doc.setFillColor(...BLUE)
  doc.rect(8, y, doc.internal.pageSize.getWidth() - 16, 8, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`Hazard: ${bowtie.hazard.hazardId}  —  ${bowtie.hazard.name}`, 12, y + 5.5)
  y += 12

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE)
  doc.text(`Top Event: `, 10, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 30)
  doc.text(bowtie.topEvent.label, 36, y)
  y += 10

  // Title block
  const tb = bowtie.titleBlock
  autoTable(doc, {
    startY: y,
    head: [['Doc Number', 'Doc Name', 'Rev By', 'Rev Date', 'Rev #']],
    body: [[tb.documentNumber || '—', tb.documentName || '—', tb.revBy || '—', tb.revDate || '—', tb.revNumber || '—']],
    theme: 'grid',
    headStyles: { fillColor: SLATE, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    margin: { left: 8, right: 8 },
    tableWidth: 'auto'
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Causes / barriers
  if (bowtie.causes.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLUE)
    doc.text('THREATS & BARRIERS', 10, y)
    y += 4

    const barrierRows: string[][] = []
    for (const c of bowtie.causes) {
      if (c.barriers.length === 0) {
        barrierRows.push([c.label, '—', '—', '—', '—', '—'])
      } else {
        for (const b of c.barriers) {
          barrierRows.push([
            c.label,
            b.label,
            b.effectiveness || '—',
            b.isSECE ? (b.seceId ? `SECE #${b.seceId}` : 'SECE') : '—',
            String(b.actions?.length ?? 0),
            b.effectivenessDescription || '—'
          ])
        }
      }
    }

    autoTable(doc, {
      startY: y,
      head: [['Threat', 'Barrier', 'Effectiveness', 'SECE', 'Actions', 'Effectiveness Basis']],
      body: barrierRows,
      theme: 'striped',
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: { 5: { cellWidth: 50 } },
      margin: { left: 8, right: 8 }
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // Consequences / mitigations
  if (bowtie.consequences.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...RED)
    doc.text('CONSEQUENCES & MITIGATIONS', 10, y)
    y += 4

    const mitRows: string[][] = []
    for (const c of bowtie.consequences) {
      if (c.mitigations.length === 0) {
        mitRows.push([c.label, severityLabel(c.severity) || '—', '—', '—', '—', '—', '—'])
      } else {
        for (const m of c.mitigations) {
          mitRows.push([
            c.label,
            severityLabel(c.severity) || '—',
            m.label,
            m.effectiveness || '—',
            m.isSECE ? (m.seceId ? `SECE #${m.seceId}` : 'SECE') : '—',
            String(m.actions?.length ?? 0),
            m.effectivenessDescription || '—'
          ])
        }
      }
    }

    autoTable(doc, {
      startY: y,
      head: [['Consequence', 'Severity', 'Mitigation', 'Effectiveness', 'SECE', 'Actions', 'Effectiveness Basis']],
      body: mitRows,
      theme: 'striped',
      headStyles: { fillColor: RED, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: { 6: { cellWidth: 44 } },
      margin: { left: 8, right: 8 }
    })
  }
}

// Full-page bowtie PNG (landscape)
function addBowtiePngPage(doc: jsPDF, dataUrl: string, bowtie: Bowtie): void {
  doc.addPage([297, 210], 'landscape')
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  addPageHeader(doc, `Bowtie Diagram: ${bowtie.name}`)

  const imgY = 16
  const imgH = H - imgY - 10
  const imgW = W - 16

  doc.addImage(dataUrl, 'PNG', 8, imgY, imgW, imgH, undefined, 'FAST')
}

// Actions summary page
function addActionsPage(doc: jsPDF, project: Project): void {
  doc.addPage('a4', 'portrait')
  addPageHeader(doc, 'Actions Register', project.name)

  const rows: string[][] = []
  for (const bt of project.bowties) {
    for (const cause of bt.causes) {
      for (const barrier of cause.barriers) {
        for (const action of barrier.actions ?? []) {
          rows.push([
            String(action.number),
            bt.name,
            'Barrier',
            cause.label,
            barrier.label,
            action.text,
            action.dueDate || '—'
          ])
        }
      }
    }
    for (const con of bt.consequences) {
      for (const mit of con.mitigations) {
        for (const action of mit.actions ?? []) {
          rows.push([
            String(action.number),
            bt.name,
            'Mitigation',
            con.label,
            mit.label,
            action.text,
            action.dueDate || '—'
          ])
        }
      }
    }
  }

  autoTable(doc, {
    startY: 18,
    head: [['#', 'Bowtie', 'Type', 'Threat / Consequence', 'Barrier / Mitigation', 'Action', 'Due Date']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—', 'No actions recorded', '—']],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: { 5: { cellWidth: 60 } },
    margin: { left: 8, right: 8 }
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
  // A4 portrait, landscape used per-bowtie
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ---- Cover page ----
  onProgress({ step: 'Building cover page…', current: 0, total: project.bowties.length + 2 })
  addCoverPage(doc, project)

  // ---- Bowtie pages ----
  for (let i = 0; i < project.bowties.length; i++) {
    const bowtie = project.bowties[i]
    onProgress({ step: `Capturing "${bowtie.name}"…`, current: i + 1, total: project.bowties.length + 2 })

    // Landscape PNG page
    const png = await captureBowtie(bowtie.id)
    if (png) addBowtiePngPage(doc, png, bowtie)

    // Properties page (portrait)
    addBowtiePropertiesPage(doc, project, bowtie)
  }

  // ---- Actions register ----
  onProgress({ step: 'Building actions register…', current: project.bowties.length + 1, total: project.bowties.length + 2 })
  addActionsPage(doc, project)

  // Stamp footers on every page (jsPDF pages are 1-indexed)
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  onProgress({ step: 'Finalising…', current: project.bowties.length + 2, total: project.bowties.length + 2 })

  // Return as base64 so IPC can pass it to the main process for saving
  return doc.output('datauristring').split(',')[1]
}
