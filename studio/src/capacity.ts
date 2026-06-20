import { CATALOG } from './catalog'
import type { DesignEdge, DesignNode, GlobalAssumptions } from './types'

export interface NodeAnalysis {
  id: string
  label: string
  type: string
  /** Per-user demand in req/s reaching this node at peak (users = 1). */
  demandPerUser: number
  /** Sustainable capacity in req/s (null = no constraint / source). */
  capacity: number | null
  capacityNote: string
  /** Max users this node alone can support. Infinity if unconstrained or no demand. */
  maxUsers: number
  /** Utilization at the reference target user count (0-1+). */
  utilization: number
  onPath: boolean
  monthlyCost: number
}

export interface SystemAnalysis {
  maxUsers: number
  bottleneckId: string | null
  bottleneckLabel: string | null
  nodes: NodeAnalysis[]
  totalMonthlyCost: number
  warnings: string[]
  reachablePeakRps: number // peak req/s at target users entering the system
}

/**
 * Propagate per-user peak demand through the graph and compute, for each node,
 * how many users it can sustain. The system maximum is the bottleneck (minimum).
 *
 * Demand model: a source emits `rpsPerUser × peakRatio` req/s per user. Each node
 * passes `demand × outflowMultiplier` to every downstream node (a node that filters
 * traffic, like a cache, reduces what reaches its downstream stores).
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

  // Sources: explicit clients, or any node with no inbound edge.
  const sources = nodes.filter(
    (n) => n.data.type === 'client' || incoming.get(n.id)!.length === 0,
  )
  if (sources.length === 0 && nodes.length > 0) {
    warnings.push('No traffic source found — add a Users/Client node or an entry point with no inbound connection.')
  }

  // Per-user peak demand entering the system.
  const entryDemand = g.rpsPerUser * g.peakRatio

  // Propagate demand with a worklist (handles DAGs; guards against cycles).
  const demand = new Map<string, number>()
  nodes.forEach((n) => demand.set(n.id, 0))
  sources.forEach((s) => demand.set(s.id, (demand.get(s.id) || 0) + entryDemand))

  const order = topoOrder(nodes, outgoing, incoming)
  if (order.cyclic) warnings.push('Cycle detected in connections — capacity propagation may be approximate.')

  for (const id of order.list) {
    const node = byId.get(id)!
    const def = CATALOG[node.data.type]
    const inflow = demand.get(id) || 0
    const mult = def.outflowMultiplier ? def.outflowMultiplier(node.data.config, g) : 1
    const outflow = inflow * mult
    for (const t of outgoing.get(id)!) {
      demand.set(t, (demand.get(t) || 0) + outflow)
    }
  }

  const analyses: NodeAnalysis[] = nodes.map((n) => {
    const def = CATALOG[n.data.type]
    const demandPerUser = demand.get(n.id) || 0
    const cap = def.capacity ? def.capacity(n.data.config, g) : null
    const capacity = cap ? cap.rps : null
    const maxUsers =
      capacity == null || demandPerUser <= 0 ? Infinity : capacity / demandPerUser
    const utilization =
      capacity == null || capacity <= 0 ? 0 : (demandPerUser * g.targetUsers) / capacity
    const monthlyCost = def.monthlyCost ? def.monthlyCost(n.data.config) : 0
    return {
      id: n.id,
      label: n.data.label,
      type: def.label,
      demandPerUser,
      capacity,
      capacityNote: cap ? cap.note : 'Source / no throughput constraint.',
      maxUsers,
      utilization,
      onPath: demandPerUser > 0,
      monthlyCost,
    }
  })

  // System max = the most constrained node that actually receives traffic.
  let maxUsers = Infinity
  let bottleneck: NodeAnalysis | null = null
  for (const a of analyses) {
    if (a.capacity != null && a.demandPerUser > 0 && a.maxUsers < maxUsers) {
      maxUsers = a.maxUsers
      bottleneck = a
    }
  }
  if (bottleneck == null) maxUsers = 0

  const totalMonthlyCost = analyses.reduce((s, a) => s + a.monthlyCost, 0)

  const orphans = analyses.filter((a) => !a.onPath && byId.get(a.id)!.data.type !== 'client' && a.capacity != null)
  if (orphans.length) {
    warnings.push(`${orphans.length} component(s) receive no traffic (not wired to a source): ${orphans.map((o) => o.label).join(', ')}.`)
  }

  return {
    maxUsers: Math.floor(maxUsers),
    bottleneckId: bottleneck?.id ?? null,
    bottleneckLabel: bottleneck?.label ?? null,
    nodes: analyses,
    totalMonthlyCost,
    warnings,
    reachablePeakRps: entryDemand * g.targetUsers,
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
  if (cyclic) {
    // Append the rest so propagation still touches every node once.
    nodes.forEach((n) => {
      if (!seen.has(n.id)) list.push(n.id)
    })
  }
  return { list, cyclic }
}

export function fmtUsers(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k'
  return String(Math.round(n))
}
