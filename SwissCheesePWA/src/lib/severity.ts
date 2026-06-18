import type { Consequence } from '../store/types'

export const SEVERITY_RANK: Record<string, number> = {
  Catastrophic: 5,
  Major: 4,
  Moderate: 3,
  Minor: 2,
  Negligible: 1
}

export const SEVERITY_OPTIONS: Array<Exclude<Consequence['severity'], ''>> = [
  'Catastrophic',
  'Major',
  'Moderate',
  'Minor',
  'Negligible'
]

export function severityLabel(severity: string): string {
  if (!severity) return ''
  const rank = SEVERITY_RANK[severity]
  return rank ? `${rank} - ${severity}` : severity
}
