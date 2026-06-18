import React, { useState, useEffect, useRef } from 'react'
import { X, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { captureActiveBowtie } from '../lib/exportRegistry'
import { generatePdfReport, type ReportProgress } from '../lib/generateReport'
import { savePdf } from '../lib/browserAPI'
import type { Project } from '../store/types'

interface Props { project: Project; onClose: () => void }
type Phase = 'idle' | 'running' | 'done' | 'error'

export function ExportReportModal({ project, onClose }: Props): React.ReactElement {
  const store = useProjectStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState<ReportProgress>({ step: 'Starting…', current: 0, total: 1 })
  const [errorMsg, setErrorMsg] = useState('')
  const [captureBowtieId, setCaptureBowtieId] = useState<string | null>(null)
  const pendingResolveRef = useRef<((png: string | null) => void) | null>(null)

  useEffect(() => {
    if (!captureBowtieId) return
    let tries = 0
    const interval = setInterval(async () => {
      tries++
      const png = await captureActiveBowtie()
      if (png || tries > 20) {
        clearInterval(interval)
        const resolve = pendingResolveRef.current
        pendingResolveRef.current = null
        setCaptureBowtieId(null)
        resolve?.(png)
      }
    }, 150)
    return () => clearInterval(interval)
  }, [captureBowtieId])

  const captureBowtie = (bowtieId: string): Promise<string | null> => {
    return new Promise((resolve) => {
      pendingResolveRef.current = resolve
      store.openBowtie(project.id, bowtieId)
      setCaptureBowtieId(bowtieId)
    })
  }

  const handleStart = async (): Promise<void> => {
    setPhase('running')
    const originalView = store.activeView
    try {
      const base64 = await generatePdfReport(project, captureBowtie, (p) => setProgress(p))
      store.setActiveView(originalView)
      savePdf(base64, project.name)
      setPhase('done')
    } catch (e) {
      store.setActiveView(originalView)
      setErrorMsg(String(e))
      setPhase('error')
    }
  }

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-2xl flex flex-col w-[480px] max-w-[95vw] text-slate-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <span className="font-semibold text-white">Export PDF Report</span>
          </div>
          {phase !== 'running' && <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>}
        </div>

        <div className="p-5">
          {phase === 'idle' && (
            <>
              <p className="text-sm text-slate-300 mb-4">Generates a full PDF report for <span className="font-semibold text-white">{project.name}</span> including:</p>
              <ul className="text-sm text-slate-400 space-y-1 mb-6 ml-3 list-disc list-inside">
                <li>Cover page with project details</li>
                <li>Full-page diagram PNG for each of the {project.bowties.length} bowtie{project.bowties.length !== 1 ? 's' : ''}</li>
                <li>Bowtie properties, barriers &amp; mitigations tables</li>
                <li>Actions register</li>
              </ul>
              <p className="text-xs text-slate-500 mb-5">The app will briefly cycle through each bowtie to capture its diagram. This takes a few seconds.</p>
              <button onClick={handleStart} className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500 text-sm">Generate &amp; Download Report</button>
            </>
          )}

          {phase === 'running' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader size={20} className="text-blue-400 animate-spin shrink-0" />
                <div className="text-sm text-slate-300">{progress.step}</div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-slate-500 text-right">{pct}%</div>
            </>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-green-400" />
              <div className="text-sm font-semibold text-white">Report downloaded</div>
              <button onClick={onClose} className="mt-2 px-5 py-2 rounded bg-slate-700 text-slate-200 text-sm hover:bg-slate-600">Close</button>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle size={40} className="text-red-400" />
              <div className="text-sm font-semibold text-white">Export failed</div>
              <div className="text-xs text-slate-400 text-center">{errorMsg}</div>
              <button onClick={() => setPhase('idle')} className="mt-2 px-5 py-2 rounded bg-slate-700 text-slate-200 text-sm hover:bg-slate-600">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
