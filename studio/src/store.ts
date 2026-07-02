import { nanoid } from 'nanoid'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { CATALOG, DEFAULT_GLOBALS } from './catalog'
import { DEFAULT_THEME_ID } from './themes'
import type { ComponentType, DesignEdge, DesignFile, DesignNode, GlobalAssumptions } from './types'

export type SelectionMode = 'pan' | 'select'
export type AlignAxis = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'
export type ViewMode = 'graph' | 'json'

interface Snapshot {
  nodes: DesignNode[]
  edges: DesignEdge[]
}

const HISTORY_LIMIT = 60
const NODE_W = 168
const NODE_H = 64

interface StoreState {
  name: string
  themeId: string
  globals: GlobalAssumptions
  nodes: DesignNode[]
  edges: DesignEdge[]
  selectedId: string | null
  selectedIds: string[]

  // editor settings
  view: ViewMode
  snapToGrid: boolean
  gridSize: number
  selectionMode: SelectionMode

  // history
  past: Snapshot[]
  future: Snapshot[]
  lastEditTag: string | null

  setName: (n: string) => void
  setTheme: (id: string) => void
  setGlobals: (g: Partial<GlobalAssumptions>) => void

  setView: (v: ViewMode) => void
  toggleSnap: () => void
  setGridSize: (n: number) => void
  setSelectionMode: (m: SelectionMode) => void

  onNodesChange: (changes: NodeChange<DesignNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (c: Connection) => void

  addNode: (type: ComponentType, pos: { x: number; y: number }) => void
  updateNodeConfig: (id: string, key: string, value: number | string) => void
  renameNode: (id: string, label: string) => void
  deleteNode: (id: string) => void

  select: (id: string | null) => void
  selectMany: (ids: string[]) => void
  selectAll: () => void
  clearSelection: () => void

  // history actions
  beginHistory: () => void
  undo: () => void
  redo: () => void

  // multi-selection ops
  copySelection: () => void
  paste: () => void
  duplicateSelection: () => void
  deleteSelection: () => void
  alignSelection: (axis: AlignAxis) => void

  loadDesign: (d: DesignFile) => void
  toDesign: () => DesignFile
  reset: () => void
}

let counter = 0
let clipboard: Snapshot | null = null

function defaultConfig(type: ComponentType): Record<string, any> {
  return { ...CATALOG[type].defaults }
}
function snap(s: StoreState): Snapshot {
  return { nodes: s.nodes, edges: s.edges }
}
function pushPast(s: StoreState): Snapshot[] {
  return [...s.past, snap(s)].slice(-HISTORY_LIMIT)
}
/** Snapshot current state into history before a discrete mutation. */
function history(s: StoreState): Pick<StoreState, 'past' | 'future' | 'lastEditTag'> {
  return { past: pushPast(s), future: [], lastEditTag: null }
}
function selectedNodeIds(s: StoreState): string[] {
  const set = new Set<string>(s.selectedIds)
  s.nodes.forEach((n) => n.selected && set.add(n.id))
  return [...set]
}

export const useStore = create<StoreState>((set, get) => ({
  name: 'Untitled design',
  themeId: DEFAULT_THEME_ID,
  globals: { ...DEFAULT_GLOBALS },
  nodes: [],
  edges: [],
  selectedId: null,
  selectedIds: [],

  view: 'graph',
  snapToGrid: true,
  gridSize: 20,
  selectionMode: 'pan',

  past: [],
  future: [],
  lastEditTag: null,

  setName: (name) => set({ name }),
  setTheme: (themeId) => set({ themeId }),
  setGlobals: (g) => set((s) => ({ globals: { ...s.globals, ...g } })),

  setView: (view) => set({ view }),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setGridSize: (gridSize) => set({ gridSize }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),

  onNodesChange: (changes) =>
    set((s) => {
      // Removals (rare via RF here) should be undoable.
      const structural = changes.some((c) => c.type === 'remove')
      return {
        nodes: applyNodeChanges(changes, s.nodes),
        ...(structural ? history(s) : {}),
      }
    }),
  onEdgesChange: (changes) =>
    set((s) => {
      const structural = changes.some((c) => c.type === 'remove')
      return {
        edges: applyEdgeChanges(changes, s.edges),
        ...(structural ? history(s) : {}),
      }
    }),
  onConnect: (c) =>
    set((s) => ({ ...history(s), edges: addEdge({ ...c, animated: true }, s.edges) })),

  addNode: (type, pos) => {
    const def = CATALOG[type]
    counter += 1
    const id = nanoid(8)
    const node: DesignNode = {
      id,
      type: 'component',
      position: pos,
      data: { type, label: `${def.label} ${counter}`, config: defaultConfig(type) },
    }
    set((s) => ({ ...history(s), nodes: [...s.nodes, node], selectedId: id, selectedIds: [id] }))
  },

  updateNodeConfig: (id, key, value) =>
    set((s) => {
      // Coalesce a burst of edits to the same field into one undo step.
      const tag = `cfg:${id}:${key}`
      const isNew = s.lastEditTag !== tag
      return {
        past: isNew ? pushPast(s) : s.past,
        future: isNew ? [] : s.future,
        lastEditTag: tag,
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } } : n,
        ),
      }
    }),

  renameNode: (id, label) =>
    set((s) => {
      const tag = `name:${id}`
      const isNew = s.lastEditTag !== tag
      return {
        past: isNew ? pushPast(s) : s.past,
        future: isNew ? [] : s.future,
        lastEditTag: tag,
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
      }
    }),

  deleteNode: (id) =>
    set((s) => ({
      ...history(s),
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedIds: s.selectedIds.filter((x) => x !== id),
    })),

  select: (selectedId) => set({ selectedId, selectedIds: selectedId ? [selectedId] : [] }),
  selectMany: (ids) => set({ selectedIds: ids, selectedId: ids[0] ?? null }),

  selectAll: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, selected: true })),
      selectedIds: s.nodes.map((n) => n.id),
      selectedId: s.nodes[0]?.id ?? null,
    })),
  clearSelection: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
      edges: s.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
      selectedId: null,
      selectedIds: [],
    })),

  beginHistory: () => set((s) => ({ ...history(s) })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {}
      const prev = s.past[s.past.length - 1]
      return {
        nodes: prev.nodes,
        edges: prev.edges,
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future].slice(0, HISTORY_LIMIT),
        lastEditTag: null,
        selectedId: null,
        selectedIds: [],
      }
    }),
  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      const next = s.future[0]
      return {
        nodes: next.nodes,
        edges: next.edges,
        past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        lastEditTag: null,
        selectedId: null,
        selectedIds: [],
      }
    }),

  copySelection: () => {
    const s = get()
    const ids = new Set(selectedNodeIds(s))
    if (!ids.size) return
    const nodes = s.nodes.filter((n) => ids.has(n.id))
    const edges = s.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
    clipboard = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
  },

  paste: () => {
    if (!clipboard || !clipboard.nodes.length) return
    set((s) => {
      const idMap = new Map<string, string>()
      const offset = s.gridSize * 2 || 32
      const newNodes: DesignNode[] = clipboard!.nodes.map((n) => {
        const id = nanoid(8)
        idMap.set(n.id, id)
        return {
          ...n,
          id,
          selected: true,
          position: { x: n.position.x + offset, y: n.position.y + offset },
          data: { ...n.data, config: { ...n.data.config } },
        }
      })
      const newEdges: DesignEdge[] = clipboard!.edges.map((e) => ({
        ...e,
        id: nanoid(8),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: false,
      }))
      const deselected = s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n))
      const ids = newNodes.map((n) => n.id)
      return {
        ...history(s),
        nodes: [...deselected, ...newNodes],
        edges: [...s.edges, ...newEdges],
        selectedIds: ids,
        selectedId: ids[0] ?? null,
      }
    })
  },

  duplicateSelection: () => {
    get().copySelection()
    get().paste()
  },

  deleteSelection: () =>
    set((s) => {
      const ids = new Set(selectedNodeIds(s))
      const hasSelEdges = s.edges.some((e) => e.selected)
      if (!ids.size && !hasSelEdges) return {}
      return {
        ...history(s),
        nodes: s.nodes.filter((n) => !ids.has(n.id)),
        edges: s.edges.filter((e) => !e.selected && !ids.has(e.source) && !ids.has(e.target)),
        selectedId: null,
        selectedIds: [],
      }
    }),

  alignSelection: (axis) =>
    set((s) => {
      const ids = new Set(selectedNodeIds(s))
      const sel = s.nodes.filter((n) => ids.has(n.id))
      if (sel.length < 2) return {}
      const w = (n: DesignNode) => n.measured?.width ?? NODE_W
      const h = (n: DesignNode) => n.measured?.height ?? NODE_H
      const lefts = sel.map((n) => n.position.x)
      const rights = sel.map((n) => n.position.x + w(n))
      const tops = sel.map((n) => n.position.y)
      const bottoms = sel.map((n) => n.position.y + h(n))
      const minL = Math.min(...lefts)
      const maxR = Math.max(...rights)
      const minT = Math.min(...tops)
      const maxB = Math.max(...bottoms)
      const avgCX = sel.reduce((a, n) => a + n.position.x + w(n) / 2, 0) / sel.length
      const avgCY = sel.reduce((a, n) => a + n.position.y + h(n) / 2, 0) / sel.length

      const move = (n: DesignNode) => {
        const p = { ...n.position }
        switch (axis) {
          case 'left': p.x = minL; break
          case 'right': p.x = maxR - w(n); break
          case 'top': p.y = minT; break
          case 'bottom': p.y = maxB - h(n); break
          case 'centerX': p.x = avgCX - w(n) / 2; break
          case 'centerY': p.y = avgCY - h(n) / 2; break
        }
        return p
      }
      return {
        ...history(s),
        nodes: s.nodes.map((n) => (ids.has(n.id) ? { ...n, position: move(n) } : n)),
      }
    }),

  loadDesign: (d) =>
    set({
      name: d.name ?? 'Untitled design',
      themeId: d.theme ?? DEFAULT_THEME_ID,
      globals: { ...DEFAULT_GLOBALS, ...d.globals },
      nodes: d.nodes ?? [],
      edges: d.edges ?? [],
      selectedId: null,
      selectedIds: [],
      past: [],
      future: [],
      lastEditTag: null,
    }),

  toDesign: () => {
    const s = get()
    return {
      app: 'system-designer-studio',
      version: 1,
      name: s.name,
      theme: s.themeId,
      globals: s.globals,
      nodes: s.nodes,
      edges: s.edges,
    }
  },

  reset: () =>
    set({
      name: 'Untitled design',
      nodes: [],
      edges: [],
      selectedId: null,
      selectedIds: [],
      globals: { ...DEFAULT_GLOBALS },
      past: [],
      future: [],
      lastEditTag: null,
    }),
}))

export function hasClipboard(): boolean {
  return !!clipboard && clipboard.nodes.length > 0
}
