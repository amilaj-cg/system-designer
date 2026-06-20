import type { IconProps, IconTheme } from './types'
import type { ComponentType } from '../types'
import { defaultTheme } from './default'

/**
 * Example of a vendor-style pack: filled rounded badges with a glyph. This
 * demonstrates how a community theme overrides the generic look. Real vendor
 * packs (AWS, Azure, GCP, OCI) would ship their own licensed glyphs here and
 * register via registerTheme() in index.ts.
 */

const GLYPH: Record<ComponentType, string> = {
  client: 'UI',
  cdn: 'CDN',
  lb: 'LB',
  apiGateway: 'API',
  idp: 'IdP',
  server: 'EC',
  cache: 'CA',
  queue: 'MQ',
  db: 'DB',
  vectorDb: 'VDB',
  llm: 'AI',
  objectStore: 'OS',
}

function badge(label: string) {
  return function Badge({ size = 28, className }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="currentColor" opacity="0.16" />
        <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={label.length > 2 ? 6.5 : 8}
          fontWeight="700"
          fill="currentColor"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label}
        </text>
      </svg>
    )
  }
}

export const solidTheme: IconTheme = {
  id: 'solid-badge',
  name: 'Solid badge',
  vendor: 'Generic',
  description: 'Filled badge glyphs — a template for vendor packs.',
  icons: Object.fromEntries(
    (Object.keys(GLYPH) as ComponentType[]).map((t) => [t, badge(GLYPH[t])]),
  ) as IconTheme['icons'],
}

void defaultTheme
