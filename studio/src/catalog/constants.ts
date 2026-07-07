import type { GlobalAssumptions } from '../types'

/** Entry-node traffic modes (values stored in a client node's `mode` config). */
export const TRAFFIC_POPULATION = 'Population (users)'
export const TRAFFIC_RATE = 'Fixed rate (API)'

export const DEFAULT_GLOBALS: GlobalAssumptions = {
  rpsPerUser: 0.05, // ~1 request every 20s per active user
  peakRatio: 3,
  targetUsers: 10_000,
  writeRatio: 0.2,
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k'
  return String(Math.round(n))
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
