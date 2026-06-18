export type Capturer = () => Promise<string>

let capturer: Capturer | null = null

export function registerCapturer(fn: Capturer | null): void {
  capturer = fn
}

export async function captureActiveBowtie(): Promise<string | null> {
  if (!capturer) return null
  return capturer()
}
