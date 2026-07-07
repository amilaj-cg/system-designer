import type { ComponentDef, ComponentPack, ComponentType } from '../types'
import { corePack } from './core'
import { containersPack } from './containers'
import { orionPack } from './orion'

export { DEFAULT_GLOBALS, TRAFFIC_POPULATION, TRAFFIC_RATE } from './constants'
export type { ComponentPack } from '../types'

/** Live registry of every registered component, keyed by type id. */
export const CATALOG: Record<ComponentType, ComponentDef> = {}

const packs: ComponentPack[] = []

/**
 * Register an extension pack. Components are stamped with the pack's display
 * name (`group`) for palette sectioning. This is the extension point for future
 * vendor packs — e.g. registerPack({ id: 'azure', name: 'Azure', components: [...] }).
 */
export function registerPack(pack: ComponentPack): void {
  packs.push(pack)
  for (const def of pack.components) {
    CATALOG[def.type] = { ...def, group: def.group ?? pack.name }
  }
}

export function listPacks(): ComponentPack[] {
  return packs
}

export function listComponents(): ComponentDef[] {
  return Object.values(CATALOG)
}

const UNKNOWN: ComponentDef = {
  type: 'unknown',
  label: 'Unknown component',
  category: 'Other',
  group: 'Other',
  accent: '#97a1bd',
  blurb: 'This component type is not registered — its pack may not be loaded.',
  fields: [],
  defaults: {},
  capacity: null,
}

/** Resolve a component definition, with a safe fallback for unregistered types. */
export function getDef(type: ComponentType): ComponentDef {
  return CATALOG[type] ?? UNKNOWN
}

export function isContainerType(type: ComponentType): boolean {
  return !!getDef(type).isContainer
}

// Built-in packs (order defines palette section order).
registerPack(corePack)
registerPack(orionPack)
registerPack(containersPack)
