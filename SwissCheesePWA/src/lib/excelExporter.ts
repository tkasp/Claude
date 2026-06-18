import ExcelJS from 'exceljs'
import type { Project } from '../store/types'

const SEVERITY_RANK: Record<string, number> = {
  Catastrophic: 5,
  Major: 4,
  Moderate: 3,
  Minor: 2,
  Negligible: 1
}

function severityLabel(severity: string): string {
  if (!severity) return ''
  const rank = SEVERITY_RANK[severity]
  return rank ? `${rank} - ${severity}` : severity
}

const EFFECTIVENESS_FILL: Record<string, string> = {
  Effective: 'FF16A34A',
  'Partially Effective': 'FFEAB308',
  Ineffective: 'FFF97316'
}

const HEADERS = [
  'Hazard ID', 'Hazard', 'Top Event', 'Threat / Consequence', 'Type',
  'Barrier / Mitigation', 'Effectiveness', 'Effectiveness Description',
  'SECE', 'SECE ID', 'Severity'
]
const COL_WIDTHS = [14, 22, 22, 28, 12, 28, 18, 40, 8, 14, 16]

function thinBorder(argb: string): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb } }
  return { top: side, left: side, bottom: side, right: side }
}

export async function generateExcel(project: Project): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Swiss Cheese'
  wb.created = new Date()

  const sheet = wb.addWorksheet('Barriers & Mitigations')
  sheet.columns = COL_WIDTHS.map((w) => ({ width: w }))
  const lastCol = HEADERS.length

  const addProjectHeader = (): void => {
    const title = sheet.addRow([`Facility: ${project.name}`])
    title.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } }
    sheet.addRow([`Location: ${project.location || '—'}`]).font = { size: 10 }
    if (project.description) sheet.addRow([`Description: ${project.description}`]).font = { size: 10 }
    sheet.addRow([])
  }

  const addBowtieBlock = (b: Project['bowties'][0]): void => {
    const nameRow = sheet.addRow([`Bowtie: ${b.name}`])
    nameRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    nameRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    sheet.mergeCells(nameRow.number, 1, nameRow.number, lastCol)

    const tb = b.titleBlock
    const tbRow = sheet.addRow([
      `Doc No.: ${tb.documentNumber || '—'}`, '',
      `Doc Name: ${tb.documentName || '—'}`, '',
      `Rev By: ${tb.revBy || '—'}`, '',
      `Rev Date: ${tb.revDate || '—'}`, '',
      `Rev #: ${tb.revNumber || '—'}`
    ])
    tbRow.font = { size: 10, italic: true, color: { argb: 'FF374151' } }
    sheet.addRow([])

    const header = sheet.addRow(HEADERS)
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = thinBorder('FF000000')
    })
    header.height = 28

    const pushRow = (
      threatOrCon: string,
      type: 'Barrier' | 'Mitigation',
      item: Project['bowties'][0]['causes'][0]['barriers'][0],
      severity: string
    ): void => {
      const row = sheet.addRow([
        b.hazard.hazardId, b.hazard.name, b.topEvent.label,
        threatOrCon, type, item.label, item.effectiveness,
        item.effectivenessDescription, item.isSECE ? 'Yes' : 'No', item.seceId, severity
      ])
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true }
        cell.border = thinBorder('FFCBD5E1')
      })
      const effFill = EFFECTIVENESS_FILL[item.effectiveness]
      if (effFill) {
        const effCell = row.getCell(7)
        effCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: effFill } }
        effCell.font = { bold: true }
      }
    }

    for (const cause of b.causes) {
      for (const barrier of cause.barriers) pushRow(cause.label, 'Barrier', barrier, '')
    }
    for (const con of b.consequences) {
      for (const mit of con.mitigations)
        pushRow(con.label, 'Mitigation', mit, severityLabel(con.severity))
    }

    sheet.addRow([])
    sheet.addRow([])
  }

  addProjectHeader()
  for (const b of project.bowties) addBowtieBlock(b)

  // Actions sheet
  const actSheet = wb.addWorksheet('Actions')
  const ACTION_HEADERS = ['Action #', 'Bowtie', 'Type', 'Barrier / Mitigation', 'Threat / Consequence', 'Action Description', 'Due Date']
  const ACTION_COL_WIDTHS = [10, 22, 12, 28, 28, 50, 14]
  actSheet.columns = ACTION_COL_WIDTHS.map((w) => ({ width: w }))

  const actHeader = actSheet.addRow(ACTION_HEADERS)
  actHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder('FF000000')
  })
  actHeader.height = 24

  let any = false
  for (const b of project.bowties) {
    for (const cause of b.causes) {
      for (const barrier of cause.barriers) {
        for (const a of barrier.actions ?? []) {
          any = true
          const row = actSheet.addRow([a.number, b.name, 'Barrier', barrier.label, cause.label, a.text, a.dueDate])
          row.eachCell((cell) => { cell.alignment = { vertical: 'middle', wrapText: true }; cell.border = thinBorder('FFCBD5E1') })
        }
      }
    }
    for (const con of b.consequences) {
      for (const mit of con.mitigations) {
        for (const a of mit.actions ?? []) {
          any = true
          const row = actSheet.addRow([a.number, b.name, 'Mitigation', mit.label, con.label, a.text, a.dueDate])
          row.eachCell((cell) => { cell.alignment = { vertical: 'middle', wrapText: true }; cell.border = thinBorder('FFCBD5E1') })
        }
      }
    }
  }
  if (!any) {
    actSheet.addRow(['No actions have been recorded.']).font = { italic: true, color: { argb: 'FF94A3B8' } }
  }

  return wb.xlsx.writeBuffer()
}
