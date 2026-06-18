import ExcelJS from 'exceljs'

interface Barrier {
  id: string
  label: string
  effectiveness: 'Effective' | 'Partially Effective' | 'Ineffective' | ''
  effectivenessDescription: string
  isSECE: boolean
  seceId: string
}

interface Cause {
  id: string
  label: string
  barriers: Barrier[]
}

interface Consequence {
  id: string
  label: string
  severity: string
  mitigations: Barrier[]
}

interface Bowtie {
  id: string
  name: string
  topEvent: { id: string; label: string }
  causes: Cause[]
  consequences: Consequence[]
  titleBlock: {
    documentNumber: string
    documentName: string
    revBy: string
    revDate: string
    revNumber: string
  }
}

interface Project {
  id: string
  name: string
  bowties: Bowtie[]
}

export async function generateExcel(project: Project): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Bowtie Risk Diagram App'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Barriers & Mitigations')

  // Header style
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A5F' }
  }
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }

  sheet.columns = [
    { header: 'Bowtie', key: 'bowtie', width: 25 },
    { header: 'Top Event', key: 'topEvent', width: 25 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Cause / Consequence', key: 'causeConsequence', width: 30 },
    { header: 'Barrier / Mitigation', key: 'barrier', width: 30 },
    { header: 'Effectiveness', key: 'effectiveness', width: 20 },
    { header: 'Effectiveness Description', key: 'effectivenessDescription', width: 40 },
    { header: 'SECE', key: 'isSECE', width: 10 },
    { header: 'SECE ID', key: 'seceId', width: 15 },
    { header: 'Document Number', key: 'docNumber', width: 20 },
    { header: 'Document Name', key: 'docName', width: 30 },
    { header: 'Rev By', key: 'revBy', width: 15 },
    { header: 'Rev Date', key: 'revDate', width: 15 },
    { header: 'Rev #', key: 'revNumber', width: 10 }
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  })
  headerRow.height = 30

  const effectivenessColors: Record<string, string> = {
    Effective: 'FF22C55E',
    'Partially Effective': 'FFFBBF24',
    Ineffective: 'FFEF4444'
  }

  for (const bowtie of project.bowties) {
    // Barriers (from causes)
    for (const cause of bowtie.causes) {
      for (const barrier of cause.barriers) {
        const row = sheet.addRow({
          bowtie: bowtie.name,
          topEvent: bowtie.topEvent.label,
          type: 'Barrier',
          causeConsequence: cause.label,
          barrier: barrier.label,
          effectiveness: barrier.effectiveness,
          effectivenessDescription: barrier.effectivenessDescription,
          isSECE: barrier.isSECE ? 'Yes' : 'No',
          seceId: barrier.seceId,
          docNumber: bowtie.titleBlock.documentNumber,
          docName: bowtie.titleBlock.documentName,
          revBy: bowtie.titleBlock.revBy,
          revDate: bowtie.titleBlock.revDate,
          revNumber: bowtie.titleBlock.revNumber
        })
        styleDataRow(row, barrier.effectiveness, effectivenessColors)
      }
    }

    // Mitigations (from consequences)
    for (const consequence of bowtie.consequences) {
      for (const mitigation of consequence.mitigations) {
        const row = sheet.addRow({
          bowtie: bowtie.name,
          topEvent: bowtie.topEvent.label,
          type: 'Mitigation',
          causeConsequence: consequence.label,
          barrier: mitigation.label,
          effectiveness: mitigation.effectiveness,
          effectivenessDescription: mitigation.effectivenessDescription,
          isSECE: mitigation.isSECE ? 'Yes' : 'No',
          seceId: mitigation.seceId,
          docNumber: bowtie.titleBlock.documentNumber,
          docName: bowtie.titleBlock.documentName,
          revBy: bowtie.titleBlock.revBy,
          revDate: bowtie.titleBlock.revDate,
          revNumber: bowtie.titleBlock.revNumber
        })
        styleDataRow(row, mitigation.effectiveness, effectivenessColors)
      }
    }
  }

  // Auto filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 14 }
  }

  // Freeze top row
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function styleDataRow(
  row: ExcelJS.Row,
  effectiveness: string,
  colors: Record<string, string>
): void {
  row.eachCell((cell) => {
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    }
  })
  // Color effectiveness cell
  const effCell = row.getCell('effectiveness')
  if (effectiveness && colors[effectiveness]) {
    effCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors[effectiveness] }
    }
    effCell.font = { bold: true, color: { argb: 'FF000000' } }
  }
  row.height = 20
}
