const BG = '#0f172a'
const AMBER = '#f5b417'

const MARK = `
  <path fill="${AMBER}" d="M22 19 L5 12 Q3 24 5 36 L22 29 Z" />
  <path fill="${AMBER}" d="M26 19 L43 12 Q45 24 43 36 L26 29 Z" />
  <rect x="21.5" y="17.5" width="5" height="13" rx="1.6" fill="${AMBER}" />
  <circle cx="10" cy="19" r="2.1" fill="${BG}" />
  <circle cx="14.5" cy="27" r="1.7" fill="${BG}" />
  <circle cx="9" cy="29" r="1.3" fill="${BG}" />
  <circle cx="16" cy="16" r="1.2" fill="${BG}" />
  <circle cx="38" cy="19" r="2.1" fill="${BG}" />
  <circle cx="33.5" cy="27" r="1.7" fill="${BG}" />
  <circle cx="39" cy="29" r="1.3" fill="${BG}" />
  <circle cx="32" cy="16" r="1.2" fill="${BG}" />
`

export function logoSvg(size: number, rounded = true): string {
  const bg = rounded ? `<rect width="48" height="48" rx="10" fill="${BG}" />` : ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${bg}${MARK}</svg>`
}

export function logoPngDataUrl(px = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const svg = logoSvg(px)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = px
      canvas.height = px
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('no 2d context'))
      }
      ctx.drawImage(img, 0, 0, px, px)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
