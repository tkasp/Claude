// Lets the canvas (which holds the ReactFlow instance) expose a capture
// function that the toolbar / File menu can invoke from outside the provider.
export type Capturer = () => Promise<string> // returns a PNG data URL

let capturer: Capturer | null = null

export function registerCapturer(fn: Capturer | null): void {
  capturer = fn
}

export async function captureActiveBowtie(): Promise<string | null> {
  if (!capturer) return null
  return capturer()
}
