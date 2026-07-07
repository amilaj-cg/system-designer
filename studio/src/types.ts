import type { Node, Edge } from '@xyflow/react'
import type { IconComponent } from './themes/types'

/**
 * A component type id. Open string so extension packs can register their own
 * (namespaced, e.g. 'orion.agentHive', 'azure.dataFactory'). The built-in core
 * pack uses bare ids ('server', 'db', ...).
 */
export type ComponentType = string

export type FieldType = 'number' | 'text' | 'select'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  unit?: string
  options?: string[]
  min?: number
  step?: number
  help?: string
  /** Only show this field when the predicate holds (given the node's config). */
  showIf?: (cfg: Record<string, any>) => boolean
}

export interface CapacityResult {
  /** Sustainable requests/sec this component can serve (headroom already applied). */
  rps: number
  /** Human-readable formula with the user's numbers substituted. */
  note: string
}

export interface GlobalAssumptions {
  /** Average requests/sec generated per active user. */
  rpsPerUser: number
  /** Peak-to-average traffic multiplier. */
  peakRatio: number
  /** Reference active-user count used to show current utilization. */
  targetUsers: number
  /** Fraction of requests that are writes (used by DB / cache models). */
  writeRatio: number
}

export interface ComponentDef {
  type: ComponentType
  label: string
  /** Palette section this belongs to within its pack (e.g. 'Security', 'Data'). */
  category: string
  /** Owning pack's display name (e.g. 'Core', 'Orion Platform'). Set at registration. */
  group?: string
  /** Tailwind-ish hex accent for the node chrome. */
  accent: string
  blurb: string
  fields: FieldDef[]
  defaults: Record<string, number | string>
  /** Sustainable throughput for this component given its config. null = pure source/sink (no constraint). */
  capacity: ((cfg: Record<string, any>, g: GlobalAssumptions) => CapacityResult) | null
  /** Fraction of inbound traffic that continues to downstream nodes (e.g. cache miss rate). Default 1. */
  outflowMultiplier?: (cfg: Record<string, any>, g: GlobalAssumptions) => number
  /** Rough monthly cost in USD for this component as configured. */
  monthlyCost?: (cfg: Record<string, any>) => number
  /** Pack-provided icon. Themes may still override by type; else this is used. */
  icon?: IconComponent
  /** If true, this is a container/boundary that other nodes can be dropped into. */
  isContainer?: boolean
  /** Initial size for container nodes. */
  defaultSize?: { width: number; height: number }
}

/** A registrable set of components — the extension unit (core, Orion, a cloud vendor, …). */
export interface ComponentPack {
  id: string
  name: string
  description?: string
  components: ComponentDef[]
}

export interface NodeData extends Record<string, unknown> {
  type: ComponentType
  label: string
  config: Record<string, any>
}

export type DesignNode = Node<NodeData>
export type DesignEdge = Edge

export interface DesignFile {
  app: 'system-designer-studio'
  version: number
  name: string
  theme: string
  globals: GlobalAssumptions
  nodes: DesignNode[]
  edges: DesignEdge[]
  savedAt?: string
}
