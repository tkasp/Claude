import ExcelJS from 'exceljs'

export interface HazidRow {
  rowIndex: number
  hazardId: string
  hazard: string
  node: string
  topEvent: string
  causes: string
  consequences: string
  riskRating: string
  rawValues: Record<string, string>
}

export interface HazidParseResult {
  headers: string[]
  rows: HazidRow[]
  columnMapping: {
    hazardId: number | null
    hazard: number | null
    node: number | null
    topEvent: number | null
    causes: number | null
    consequences: number | null
    riskRating: number | null
  }
}

const ALIAS: Record<string, keyof HazidParseResult['columnMapping']> = {
  'hazard id': 'hazardId',
  'hazard no': 'hazardId',
  'hazard ref': 'hazardId',
  'ref': 'hazardId',
  'no.': 'hazardId',
  'no': 'hazardId',
  'hazard number': 'hazardId',
  'hazard': 'hazard',
  'hazard description': 'hazard',
  'hazard type': 'hazard',
  'hazard name': 'hazard',
  'node': 'node',
  'area': 'node',
  'section': 'node',
  'system': 'node',
  'top event': 'topEvent',
  'deviation': 'topEvent',
  'scenario': 'topEvent',
  'unwanted event': 'topEvent',
  'loss of control': 'topEvent',
  'cause': 'causes',
  'causes': 'causes',
  'initiating cause': 'causes',
  'threats': 'causes',
  'threat': 'causes',
  'consequence': 'consequences',
  'consequences': 'consequences',
  'outcome': 'consequences',
  'outcomes': 'consequences',
  'risk rating': 'riskRating',
  'ram consequence ranking': 'riskRating',
  'ram consequence rating': 'riskRating',
  'consequence ranking': 'riskRating',
  'consequence rating': 'riskRating',
  'ram ranking': 'riskRating',
  'ram rating': 'riskRating',
  'risk': 'riskRating',
  'risk level': 'riskRating',
  'likelihood': 'riskRating',
  'severity': 'riskRating',
  'rating': 'riskRating'
}

function cellText(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return ''
  if (typeof cell.value === 'object' && 'richText' in (cell.value as object)) {
    return (cell.value as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('')
  }
  return String(cell.value).trim()
}

export async function parseHazidExcel(base64: string): Promise<HazidParseResult> {
  const binStr = atob(base64)
  const buf = new Uint8Array(binStr.length)
  for (let i = 0; i < binStr.length; i++) buf[i] = binStr.charCodeAt(i)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf.buffer as ArrayBuffer)

  let sheet: ExcelJS.Worksheet | undefined
  wb.eachSheet((ws) => {
    if (!sheet && ws.rowCount > 1) sheet = ws
  })
  if (!sheet) throw new Error('No worksheet found in HAZID file')

  let headerRowNum = 1
  sheet.eachRow((row, n) => {
    if (headerRowNum > 1) return
    let nonEmpty = 0
    row.eachCell(() => nonEmpty++)
    if (nonEmpty >= 3) headerRowNum = n
  })

  const headerRow = sheet.getRow(headerRowNum)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(cellText(cell))
  })

  const mapping: HazidParseResult['columnMapping'] = {
    hazardId: null,
    hazard: null,
    node: null,
    topEvent: null,
    causes: null,
    consequences: null,
    riskRating: null
  }

  headers.forEach((h, i) => {
    const key = h.toLowerCase().trim()
    const field = ALIAS[key]
    if (field && mapping[field] === null) mapping[field] = i
  })

  if (mapping.hazardId === null && headers.length > 0) mapping.hazardId = 0

  const rows: HazidRow[] = []
  const colOf = (field: keyof typeof mapping): number => mapping[field] ?? -1

  sheet.eachRow((row, n) => {
    if (n <= headerRowNum) return
    const cells: string[] = []
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cellText(cell))
    })
    if (cells.every((c) => !c)) return

    const get = (idx: number): string => (idx >= 0 ? cells[idx] ?? '' : '')

    const rawValues: Record<string, string> = {}
    headers.forEach((h, i) => {
      rawValues[h] = cells[i] ?? ''
    })

    rows.push({
      rowIndex: n,
      hazardId: get(colOf('hazardId')),
      hazard: get(colOf('hazard')),
      node: get(colOf('node')),
      topEvent: get(colOf('topEvent')),
      causes: get(colOf('causes')),
      consequences: get(colOf('consequences')),
      riskRating: get(colOf('riskRating')),
      rawValues
    })
  })

  return { headers, rows, columnMapping: mapping }
}
