import { getDef, TRAFFIC_RATE } from './catalog'
import type { DesignEdge, DesignNode, GlobalAssumptions } from './types'

export type SourceMode = 'population' | 'rate'

export interface NodeAnalysis {
  id: string
  label: string
  type: string
  /** Req/s reaching this node at peak, under the configured traffic mix. */
  demand: number
  /** Sustainable capacity in req/s (null = source / no constraint). */
  capacity: number | null
  capacityNote: string
  /** demand ÷ capacity at the configured mix (0-1+). */
  utilization: number
  /** capacity ÷ demand — how much traffic can grow before this node saturates. */
  headroom: number
  onPath: boolean
  monthlyCost: number
}

export interface SourceAnalysis {
  id: string
  label: string
  mode: SourceMode
  /** Configured population (population mode). */
  users?: number
  /** Configured flat rate before peak (rate mode). */
  rps?: number
  /** Peak req/s this source emits into the system at the configured mix. */
  peakRps: number
  /** Max sustainable at the system's scale ceiling. */
  maxUsers?: number
  maxRps?: number
}

export interface SystemAnalysis {
  /** How much total traffic can grow before the bottleneck saturates (×). */
  scaleMultiplier: number
  /** Total sustainable users across all population sources (0 if none). */
  maxUsers: number
  bottleneckId: string | null
  bottleneckLabel: string | null
  nodes: NodeAnalysis[]
  sources: SourceAnalysis[]
  totalMonthlyCost: number
  warnings: string[]
  /** Total peak req/s entering the system at the configured mix. */
  configuredPeakRps: number
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && v !== '' && v != null ? n : fallback
}

/** Peak req/s a source emits, based on its own config (falling back to globals). */
function sourceEmission(node: DesignNode, g: GlobalAssumptions): Omit<SourceAnalysis, 'id' | 'label'> {
  const cfg = node.data.config || {}
  const peak = num(cfg.peak, g.peakRatio)

  // Explicit client nodes carry their own workload; other entry points (a node
  // with no inbound edge) fall back to the global default population.
  if (node.data.type === 'client' && cfg.mode === TRAFFIC_RATE) {
    const rps = num(cfg.rps, 0)
    return { mode: 'rate', rps, peakRps: rps * peak }
  }
  const users = node.data.type === 'client' ? num(cfg.users, g.targetUsers) : g.targetUsers
  const rpu = node.data.type === 'client' ? num(cfg.rpsPerUser, g.rpsPerUser) : g.rpsPerUser
  return { mode: 'population', users, peakRps: users * rpu * peak }
}

/**
 * Propagate each source's configured peak demand through the wired graph, then
 * report how far total traffic can scale before the tightest node saturates.
 *
 * Because demand is linear in traffic, the whole system can grow by
 * `scaleMultiplier = min(capacity ÷ demand)` over constrained on-path nodes.
 * Each population source can then serve `users × scaleMultiplier`.
 */
export function analyze(
  nodes: DesignNode[],
  edges: DesignEdge[],
  g: GlobalAssumptions,
): SystemAnalysis {
  const warnings: string[] = []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  nodes.forEach((n) => {
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
  })
  edges.forEach((e) => {
    if (byId.has(e.source) && byId.has(e.target)) {
      outgoing.get(e.source)!.push(e.target)
      incoming.get(e.target)!.push(e.source)
    }
  })

  // Containers/boundaries carry no traffic — never treat them as sources.
  const sourceNodes = nodes.filter(
    (n) => !getDef(n.data.type).isContainer && (n.data.type === 'client' || incoming.get(n.id)!.length === 0),
  )
  if (sourceNodes.length === 0 && nodes.length > 0) {
    warnings.push('No traffic source found — add a Users/Client node or an entry point with no inbound connection.')
  }

  const demand = new Map<string, number>()
  nodes.forEach((n) => demand.set(n.id, 0))
  const emissions = new Map<string, ReturnType<typeof sourceEmission>>()
  sourceNodes.forEach((s) => {
    const em = sourceEmission(s, g)
    emissions.set(s.id, em)
    demand.set(s.id, (demand.get(s.id) || 0) + em.peakRps)
  })

  const order = topoOrder(nodes, outgoing, incoming)
  if (order.cyclic) warnings.push('Cycle detected in connections — capacity propagation may be approximate.')

  for (const id of order.list) {
    const node = byId.get(id)!
    const def = getDef(node.data.type)
    const inflow = demand.get(id) || 0
    const mult = def.outflowMultiplier ? def.outflowMultiplier(node.data.config, g) : 1
    const outflow = inflow * mult
    for (const t of outgoing.get(id)!) demand.set(t, (demand.get(t) || 0) + outflow)
  }

  const analyses: NodeAnalysis[] = nodes.map((n) => {
    const def = getDef(n.data.type)
    const d = demand.get(n.id) || 0
    const cap = def.capacity ? def.capacity(n.data.config, g) : null
    const capacity = cap ? cap.rps : null
    const utilization = capacity == null || capacity <= 0 ? 0 : d / capacity
    const headroom = capacity == null || d <= 0 ? Infinity : capacity / d
    return {
      id: n.id,
      label: n.data.label,
      type: def.label,
      demand: d,
      capacity,
      capacityNote: cap ? cap.note : 'Source / no throughput constraint.',
      utilization,
      headroom,
      onPath: d > 0,
      monthlyCost: def.monthlyCost ? def.monthlyCost(n.data.config) : 0,
    }
  })

  // System headroom = the tightest constrained node that receives traffic.
  let scaleMultiplier = Infinity
  let bottleneck: NodeAnalysis | null = null
  for (const a of analyses) {
    if (a.capacity != null && a.demand > 0 && a.headroom < scaleMultiplier) {
      scaleMultiplier = a.headroom
      bottleneck = a
    }
  }
  const S = scaleMultiplier

  const sources: SourceAnalysis[] = sourceNodes.map((s) => {
    const em = emissions.get(s.id)!
    return {
      id: s.id,
      label: s.data.label,
      mode: em.mode,
      users: em.users,
      rps: em.rps,
      peakRps: em.peakRps,
      maxUsers: em.mode === 'population' ? (isFinite(S) ? Math.floor((em.users || 0) * S) : Infinity) : undefined,
      maxRps: em.mode === 'rate' ? (isFinite(S) ? (em.rps || 0) * S : Infinity) : undefined,
    }
  })

  const popSources = sources.filter((s) => s.mode === 'population')
  const maxUsers = popSources.length === 0 ? 0 : isFinite(S) ? popSources.reduce((a, s) => a + (s.maxUsers || 0), 0) : Infinity

  if (isFinite(S) && S < 1) {
    warnings.push(`Configured traffic exceeds capacity — ${bottleneck?.label ?? 'a component'} is over 100% utilized. Scale it up or reduce load.`)
  }

  const orphans = analyses.filter((a) => !a.onPath && byId.get(a.id)!.data.type !== 'client' && a.capacity != null)
  if (orphans.length) {
    warnings.push(`${orphans.length} component(s) receive no traffic (not wired to a source): ${orphans.map((o) => o.label).join(', ')}.`)
  }

  return {
    scaleMultiplier: S,
    maxUsers: isFinite(maxUsers) ? Math.floor(maxUsers) : Infinity,
    bottleneckId: bottleneck?.id ?? null,
    bottleneckLabel: bottleneck?.label ?? null,
    nodes: analyses,
    sources,
    totalMonthlyCost: analyses.reduce((s, a) => s + a.monthlyCost, 0),
    warnings,
    configuredPeakRps: sources.reduce((s, x) => s + x.peakRps, 0),
  }
}

function topoOrder(
  nodes: DesignNode[],
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>,
): { list: string[]; cyclic: boolean } {
  const indeg = new Map<string, number>()
  nodes.forEach((n) => indeg.set(n.id, incoming.get(n.id)!.length))
  const queue = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id)
  const list: string[] = []
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    list.push(id)
    for (const t of outgoing.get(id)!) {
      indeg.set(t, (indeg.get(t) || 0) - 1)
      if ((indeg.get(t) || 0) <= 0) queue.push(t)
    }
  }
  const cyclic = list.length < nodes.length
  if (cyclic) nodes.forEach((n) => !seen.has(n.id) && list.push(n.id))
  return { list, cyclic }
}

export function fmtUsers(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k'
  return String(Math.round(n))
}

export function fmtMult(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n >= 100) return Math.round(n) + '×'
  if (n >= 10) return n.toFixed(0) + '×'
  return n.toFixed(1) + '×'
}
