import React, { useState, useEffect } from 'react'
import { X, ChevronDown, AlertCircle, Loader } from 'lucide-react'
import type { HazidRow, HazidParseResult } from '../electron-api.d'
import { useProjectStore } from '../store/projectStore'

interface Props {
  projectId: string
  attachment: { name: string; dataBase64: string }
  onClose: () => void
}

export function HazidImportModal({ projectId, attachment, onClose }: Props): React.ReactElement {
  const store = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<HazidParseResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [mapping, setMapping] = useState<HazidParseResult['columnMapping'] | null>(null)

  useEffect(() => {
    window.electronAPI
      .parseHazid(attachment.dataBase64)
      .then((res) => {
        if (res.success && res.result) {
          setParsed(res.result)
          setMapping(res.result.columnMapping)
          // Pre-select all rows
          setSelected(new Set(res.result.rows.map((r) => r.rowIndex)))
        } else {
          setError(res.error ?? 'Failed to parse HAZID file')
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [attachment.dataBase64])

  const toggleRow = (rowIndex: number): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  const toggleAll = (): void => {
    if (!parsed) return
    if (selected.size === parsed.rows.length) setSelected(new Set())
    else setSelected(new Set(parsed.rows.map((r) => r.rowIndex)))
  }

  const getCell = (row: HazidRow, colIdx: number | null): string => {
    if (colIdx === null || colIdx < 0) return ''
    return row.rawValues[parsed!.headers[colIdx]] ?? ''
  }

  const handleGenerate = (): void => {
    if (!parsed || !mapping) return
    const rows = parsed.rows.filter((r) => selected.has(r.rowIndex))
    const stubs = rows.map((row, i) => {
      const hazardId = getCell(row, mapping.hazardId)
      const hazardName = getCell(row, mapping.hazard)
      const topEvent = getCell(row, mapping.topEvent)
      const node = getCell(row, mapping.node)
      const name = hazardId
        ? `${hazardId} – ${hazardName || topEvent || 'Bowtie'}`
        : hazardName || `Bowtie ${i + 1}`
      return { name, hazardId, hazardName: node ? `${node}: ${hazardName}` : hazardName, topEvent }
    })
    store.batchAddBowties(projectId, stubs)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col w-[900px] max-w-[95vw] max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <div className="font-semibold text-gray-900">Import from HAZID</div>
            <div className="text-xs text-gray-500 mt-0.5">{attachment.name}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-gray-500">
              <Loader size={20} className="animate-spin" />
              Parsing HAZID file…
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-600 p-8">
              <AlertCircle size={32} />
              <div className="text-sm text-center">{error}</div>
            </div>
          )}

          {parsed && mapping && !loading && !error && (
            <>
              {/* Column mapping */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Column Mapping
                </div>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { field: 'hazardId', label: 'Hazard ID' },
                      { field: 'hazard', label: 'Hazard' },
                      { field: 'node', label: 'Node / Area' },
                      { field: 'topEvent', label: 'Top Event / Deviation' },
                      { field: 'causes', label: 'Causes' },
                      { field: 'consequences', label: 'Consequences' },
                      { field: 'riskRating', label: 'Risk Rating' }
                    ] as Array<{ field: keyof typeof mapping; label: string }>
                  ).map(({ field, label }) => (
                    <div key={field} className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">{label}:</span>
                      <div className="relative">
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-0.5 pr-6 appearance-none bg-white"
                          value={mapping[field] ?? -1}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setMapping((m) => (m ? { ...m, [field]: val < 0 ? null : val } : m))
                          }}
                        >
                          <option value={-1}>(none)</option>
                          {parsed.headers.map((h, i) => (
                            <option key={i} value={i}>
                              {h || `Col ${i + 1}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-gray-200 w-8">
                        <input
                          type="checkbox"
                          checked={selected.size === parsed.rows.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">
                        Hazard ID
                      </th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">
                        Node / Area
                      </th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">
                        Hazard
                      </th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">
                        Top Event / Deviation
                      </th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">
                        Risk Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`cursor-pointer border-b border-gray-100 ${
                          selected.has(row.rowIndex)
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'hover:bg-gray-50'
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
                        <td className="px-3 py-1.5 font-mono text-gray-700 whitespace-nowrap">
                          {getCell(row, mapping.hazardId) || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 max-w-[120px] truncate">
                          {getCell(row, mapping.node) || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-800 max-w-[180px]">
                          {getCell(row, mapping.hazard) || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-800 max-w-[200px]">
                          {getCell(row, mapping.topEvent) || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                          {getCell(row, mapping.riskRating) || '—'}
                        </td>
                      </tr>
                    ))}
                    {parsed.rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                          No data rows found in this file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {parsed ? `${selected.size} of ${parsed.rows.length} rows selected` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={selected.size === 0 || !parsed}
              className="px-4 py-1.5 text-sm rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate {selected.size > 0 ? `${selected.size} Bowtie${selected.size > 1 ? 's' : ''}` : 'Bowties'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
