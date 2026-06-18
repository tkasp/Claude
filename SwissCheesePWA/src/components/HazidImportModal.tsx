import React, { useState, useEffect, useMemo } from 'react'
import { X, AlertCircle, Loader, Filter } from 'lucide-react'
import { parseHazidExcel, type HazidRow, type HazidParseResult } from '../lib/hazidParser'
import { useProjectStore } from '../store/projectStore'

interface Props {
  projectId: string
  attachment: { name: string; dataBase64: string }
  onClose: () => void
}

function isHighSeverity(rating: string): boolean {
  const t = rating.trim()
  return /^[45]/.test(t) || /catastrophic|major/i.test(t)
}

export function HazidImportModal({ projectId, attachment, onClose }: Props): React.ReactElement {
  const store = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<HazidParseResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [filterHazardId, setFilterHazardId] = useState('')
  const [filterHazard, setFilterHazard] = useState('')
  const [filterTopEvent, setFilterTopEvent] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [highSevOnly, setHighSevOnly] = useState(false)

  useEffect(() => {
    parseHazidExcel(attachment.dataBase64)
      .then((result) => {
        setParsed(result)
        setSelected(new Set(result.rows.map((r) => r.rowIndex)))
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [attachment.dataBase64])

  const mapping = parsed?.columnMapping ?? null

  const getCell = (row: HazidRow, field: keyof NonNullable<typeof mapping>): string => {
    if (!parsed || !mapping) return ''
    const colIdx = mapping[field]
    if (colIdx === null || colIdx < 0) return ''
    return row.rawValues[parsed.headers[colIdx]] ?? ''
  }

  const filteredRows = useMemo(() => {
    if (!parsed) return []
    return parsed.rows.filter((row) => {
      const hazardId = getCell(row, 'hazardId')
      const hazard = getCell(row, 'hazard')
      const topEvent = getCell(row, 'topEvent')
      const risk = getCell(row, 'riskRating')

      if (highSevOnly && !isHighSeverity(risk)) return false
      if (filterHazardId && !hazardId.toLowerCase().includes(filterHazardId.toLowerCase())) return false
      if (filterHazard && !hazard.toLowerCase().includes(filterHazard.toLowerCase())) return false
      if (filterTopEvent && !topEvent.toLowerCase().includes(filterTopEvent.toLowerCase())) return false
      if (filterRisk && !risk.toLowerCase().includes(filterRisk.toLowerCase())) return false
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, filterHazardId, filterHazard, filterTopEvent, filterRisk, highSevOnly])

  const toggleRow = (rowIndex: number): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  const allFilteredSelected = filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.rowIndex))

  const toggleAllFiltered = (): void => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredRows.forEach((r) => next.delete(r.rowIndex))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredRows.forEach((r) => next.add(r.rowIndex))
        return next
      })
    }
  }

  const handleHighSevToggle = (): void => {
    const next = !highSevOnly
    setHighSevOnly(next)
    if (next && parsed) {
      const highRows = new Set(
        parsed.rows.filter((r) => isHighSeverity(getCell(r, 'riskRating'))).map((r) => r.rowIndex)
      )
      setSelected(highRows)
    }
  }

  const handleGenerate = (): void => {
    if (!parsed || !mapping) return
    const rows = parsed.rows.filter((r) => selected.has(r.rowIndex))
    const stubs = rows.map((row, i) => {
      const hazardId = getCell(row, 'hazardId')
      const hazardName = getCell(row, 'hazard')
      const topEvent = getCell(row, 'topEvent')
      const name = hazardId
        ? `${hazardId} – ${hazardName || topEvent || 'Bowtie'}`
        : hazardName || `Bowtie ${i + 1}`
      return { name, hazardId, hazardName, topEvent }
    })
    store.batchAddBowties(projectId, stubs)
    onClose()
  }

  const FilterInput = ({
    value,
    onChange,
    placeholder
  }: {
    value: string
    onChange: (v: string) => void
    placeholder: string
  }): React.ReactElement => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400"
    />
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-2xl flex flex-col w-[950px] max-w-[95vw] max-h-[88vh] text-slate-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <div>
            <div className="font-semibold text-white">Import from HAZID</div>
            <div className="text-xs text-slate-400 mt-0.5">{attachment.name}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-slate-300">
              <Loader size={20} className="animate-spin" />
              Parsing HAZID file…
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-400 p-8">
              <AlertCircle size={32} />
              <div className="text-sm text-center">{error}</div>
            </div>
          )}

          {parsed && !loading && !error && (
            <>
              <div className="px-4 py-2.5 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    <Filter size={12} /> Filters
                  </div>
                  <button
                    onClick={handleHighSevToggle}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      highSevOnly
                        ? 'bg-red-700 border-red-500 text-white'
                        : 'border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400'
                    }`}
                  >
                    Severity 4 &amp; 5 Only
                  </button>
                  {(filterHazardId || filterHazard || filterTopEvent || filterRisk) && (
                    <button
                      onClick={() => {
                        setFilterHazardId('')
                        setFilterHazard('')
                        setFilterTopEvent('')
                        setFilterRisk('')
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear filters
                    </button>
                  )}
                  <span className="ml-auto text-xs text-slate-500">
                    Showing {filteredRows.length} / {parsed.rows.length} rows
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <FilterInput value={filterHazardId} onChange={setFilterHazardId} placeholder="Hazard ID…" />
                  <FilterInput value={filterHazard} onChange={setFilterHazard} placeholder="Hazard…" />
                  <FilterInput value={filterTopEvent} onChange={setFilterTopEvent} placeholder="Top Event…" />
                  <FilterInput value={filterRisk} onChange={setFilterRisk} placeholder="Consequence Rating…" />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-700 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-slate-600 w-8">
                        <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-600 text-slate-300 font-semibold whitespace-nowrap">Hazard ID</th>
                      <th className="px-3 py-2 text-left border-b border-slate-600 text-slate-300 font-semibold whitespace-nowrap">Hazard</th>
                      <th className="px-3 py-2 text-left border-b border-slate-600 text-slate-300 font-semibold whitespace-nowrap">Top Event / Deviation</th>
                      <th className="px-3 py-2 text-left border-b border-slate-600 text-slate-300 font-semibold whitespace-nowrap">Consequence Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const risk = getCell(row, 'riskRating')
                      const high = isHighSeverity(risk)
                      return (
                        <tr
                          key={row.rowIndex}
                          className={`cursor-pointer border-b border-slate-700/60 ${
                            selected.has(row.rowIndex)
                              ? 'bg-blue-900/40 hover:bg-blue-900/60'
                              : 'hover:bg-slate-700/40'
                          }`}
                          onClick={() => toggleRow(row.rowIndex)}
                        >
                          <td className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={selected.has(row.rowIndex)}
                              onChange={() => toggleRow(row.rowIndex)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-1.5 font-mono text-slate-300 whitespace-nowrap">{getCell(row, 'hazardId') || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-200 max-w-[220px]">{getCell(row, 'hazard') || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-200 max-w-[200px]">{getCell(row, 'topEvent') || '—'}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            <span className={`font-semibold ${high ? 'text-red-400' : 'text-slate-400'}`}>{risk || '—'}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No rows match the current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700 bg-slate-900/40">
          <div className="text-xs text-slate-400">
            {parsed ? `${selected.size} row${selected.size !== 1 ? 's' : ''} selected` : ''}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</button>
            <button
              onClick={handleGenerate}
              disabled={selected.size === 0 || !parsed}
              className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate {selected.size > 0 ? `${selected.size} Bowtie${selected.size > 1 ? 's' : ''}` : 'Bowties'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
