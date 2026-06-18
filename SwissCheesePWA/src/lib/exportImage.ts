import { toPng } from 'html-to-image'
import { getNodesBounds, type ReactFlowInstance } from '@xyflow/react'
import type { Bowtie, Project } from '../store/types'

interface TitleField {
  label: string
  value: string
}

function titleFieldsFor(project: Project, bowtie: Bowtie): { heading: string; fields: TitleField[] } {
  const tb = bowtie.titleBlock
  return {
    heading: `${project.name}  —  ${bowtie.name}`,
    fields: [
      { label: 'Document Number', value: tb.documentNumber },
      { label: 'Document Name', value: tb.documentName },
      { label: 'Rev By', value: tb.revBy },
      { label: 'Rev Date', value: tb.revDate },
      { label: 'Rev #', value: tb.revNumber }
    ]
  }
}

function composeWithTitleBlock(
  bowtieDataUrl: string,
  imgW: number,
  imgH: number,
  heading: string,
  fields: TitleField[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = imgW > 0 ? img.width / imgW : 1
      const headingH = 30
      const tableH = 56
      const footerH = headingH + tableH
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height + Math.round(footerH * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no 2d context'))
      ctx.scale(scale, scale)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
      ctx.drawImage(img, 0, 0, imgW, imgH)

      ctx.fillStyle = '#1e3a8a'
      ctx.fillRect(0, imgH, imgW, headingH)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText(heading, 12, imgH + headingH / 2)

      const tableTop = imgH + headingH
      const colW = imgW / fields.length
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      fields.forEach((f, i) => {
        const x = i * colW
        ctx.strokeRect(x, tableTop, colW, tableH)
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 10px Arial, sans-serif'
        ctx.textBaseline = 'top'
        ctx.fillText(f.label.toUpperCase(), x + 8, tableTop + 8)
        ctx.fillStyle = '#0f172a'
        ctx.font = '13px Arial, sans-serif'
        ctx.fillText(f.value || '—', x + 8, tableTop + 28, colW - 16)
      })

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = bowtieDataUrl
  })
}

export async function captureBowtieDataUrl(
  instance: ReactFlowInstance,
  wrapperEl: HTMLElement,
  project: Project,
  bowtie: Bowtie
): Promise<string> {
  const nodes = instance.getNodes()
  const bounds = getNodesBounds(nodes)

  const margin = 80
  const imgW = Math.max(Math.ceil(bounds.width) + margin * 2, 700)
  const imgH = Math.max(Math.ceil(bounds.height) + margin * 2, 420)
  const tx = -bounds.x + margin
  const ty = -bounds.y + margin

  const viewportEl = wrapperEl.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewportEl) throw new Error('viewport element not found')

  const bowtieDataUrl = await toPng(viewportEl, {
    backgroundColor: '#ffffff',
    width: imgW,
    height: imgH,
    pixelRatio: 2,
    style: {
      width: `${imgW}px`,
      height: `${imgH}px`,
      transform: `translate(${tx}px, ${ty}px) scale(1)`
    }
  })

  const { heading, fields } = titleFieldsFor(project, bowtie)
  return composeWithTitleBlock(bowtieDataUrl, imgW, imgH, heading, fields)
}
