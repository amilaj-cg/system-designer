import type { ComponentType } from '../types'
import { defaultTheme } from './default'
import { solidTheme } from './solid'
import type { IconComponent, IconTheme } from './types'

export type { IconTheme, IconComponent, IconProps } from './types'

const registry = new Map<string, IconTheme>()

/** Register a community/vendor icon pack. Themes may override any subset of
 *  components; missing icons fall back to the generic default theme. */
export function registerTheme(theme: IconTheme): void {
  registry.set(theme.id, theme)
}

export function getTheme(id: string): IconTheme {
  return registry.get(id) ?? defaultTheme
}

export function listThemes(): IconTheme[] {
  return Array.from(registry.values())
}

/** Resolve the icon for a component in a theme, falling back to the default. */
export function getIcon(themeId: string, type: ComponentType): IconComponent {
  const theme = registry.get(themeId)
  return theme?.icons[type] ?? defaultTheme.icons[type] ?? FallbackIcon
}

const FallbackIcon: IconComponent = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

// Built-in packs.
registerTheme(defaultTheme)
registerTheme(solidTheme)

export const DEFAULT_THEME_ID = defaultTheme.id
