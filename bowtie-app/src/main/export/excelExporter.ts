import ExcelJS from 'exceljs'

interface Barrier {
  label: string
  effectiveness: string
  effectivenessDescription: string
  isSECE: boolean
  seceId: string
}
interface Cause {
  label: string
  barriers: Barrier[]
}
interface Consequence {
  label: string
  severity: string
  mitigations: Barrier[]
}
interface TitleBlock {
  documentNumber: string
  documentName: string
  revBy: string
  revDate: string
  revNumber: string
}
interface Bowtie {
  name: string
  hazard: { hazardId: string; name: string }
  topEvent: { label: string }
  causes: Cause[]
  consequences: Consequence[]
  titleBlock: TitleBlock
}
interface Project {
  name: string
  location: string
  description: string
  bowties: Bowtie[]
}

const EFFECTIVENESS_FILL: Record<string, string> = {
  Effective: 'FF16A34A',
  'Partially Effective': 'FFEAB308',
  Ineffective: 'FFF97316'
}

const HEADERS = [
  'Hazard ID',
  'Hazard',
  'Top Event',
  'Threat / Consequence',
  'Type',
  'Barrier / Mitigation',
  'Effectiveness',
  'Effectiveness Description',
  'SECE',
  'SECE ID',
  'Severity'
]

const COL_WIDTHS = [14, 22, 22, 28, 12, 28, 18, 40, 8, 14, 16]

export async function generateExcel(project: Project): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Bowtie Builder'
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

  const addBowtieReportBlock = (b: Bowtie): void => {
    // Bowtie title block as a small report header
    const nameRow = sheet.addRow([`Bowtie: ${b.name}`])
    nameRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    nameRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    }
    sheet.mergeCells(nameRow.number, 1, nameRow.number, lastCol)

    const tb = b.titleBlock
    const tbRow = sheet.addRow([
      `Doc No.: ${tb.documentNumber || '—'}`,
      '',
      `Doc Name: ${tb.documentName || '—'}`,
      '',
      `Rev By: ${tb.revBy || '—'}`,
      '',
      `Rev Date: ${tb.revDate || '—'}`,
      '',
      `Rev #: ${tb.revNumber || '—'}`
    ])
    tbRow.font = { size: 10, italic: true, color: { argb: 'FF374151' } }
    sheet.addRow([])

    // Column headers
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
      item: Barrier,
      severity: string
    ): void => {
      const row = sheet.addRow([
        b.hazard.hazardId,
        b.hazard.name,
        b.topEvent.label,
        threatOrCon,
        type,
        item.label,
        item.effectiveness,
        item.effectivenessDescription,
        item.isSECE ? 'Yes' : 'No',
        item.seceId,
        severity
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
      for (const mit of con.mitigations) pushRow(con.label, 'Mitigation', mit, con.severity)
    }

    sheet.addRow([])
    sheet.addRow([])
  }

  addProjectHeader()
  for (const b of project.bowties) addBowtieReportBlock(b)

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function thinBorder(argb: string): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb } }
  return { top: side, left: side, bottom: side, right: side }
}
