import Dagre from '@dagrejs/dagre'
import type { DesignEdge, DesignNode } from '../types'

export type LayoutDirection = 'LR' | 'TB'

const DEFAULT_W = 168
const DEFAULT_H = 76

/**
 * Layered (Sugiyama) auto-layout via dagre. Ranks nodes by flow depth and
 * orders them within each rank to minimise edge crossings, which removes node
 * overlaps and keeps connections from cutting across components.
 *
 * dagre reports node centres; React Flow positions are top-left, so we offset
 * by half the node size. Sizes come from React Flow's measured dimensions when
 * available, else sensible defaults.
 */
export function autoLayout(
  nodes: DesignNode[],
  edges: DesignEdge[],
  direction: LayoutDirection = 'LR',
): DesignNode[] {
  if (nodes.length === 0) return nodes

  const g = new Dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: 44, // gap between nodes in the same rank
    ranksep: 96, // gap between ranks (flow direction)
    marginx: 24,
    marginy: 24,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const size = (n: DesignNode) => ({
    width: n.measured?.width ?? DEFAULT_W,
    height: n.measured?.height ?? DEFAULT_H,
  })

  nodes.forEach((n) => g.setNode(n.id, size(n)))
  edges.forEach((e) => {
    if (e.source !== e.target) g.setEdge(e.source, e.target)
  })

  Dagre.layout(g)

  return nodes.map((n) => {
    const p = g.node(n.id)
    if (!p) return n
    const { width, height } = size(n)
    return { ...n, position: { x: p.x - width / 2, y: p.y - height / 2 } }
  })
}
