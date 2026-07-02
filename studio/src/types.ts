import type { Node, Edge } from '@xyflow/react'

export type ComponentType =
  | 'client'
  | 'cdn'
  | 'lb'
  | 'apiGateway'
  | 'idp'
  | 'server'
  | 'cache'
  | 'queue'
  | 'db'
  | 'vectorDb'
  | 'llm'
  | 'objectStore'

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
  category: string
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
