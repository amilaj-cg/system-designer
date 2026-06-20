import type { ComponentType as ReactCT } from 'react'
import type { ComponentType } from '../types'

export interface IconProps {
  size?: number
  className?: string
}

export type IconComponent = ReactCT<IconProps>

export interface IconTheme {
  id: string
  name: string
  /** Vendor/family label shown in the theme picker (e.g. "Generic", "AWS"). */
  vendor: string
  /** Short note about the pack. */
  description?: string
  /** Per-component icon. Missing entries fall back to the default theme. */
  icons: Partial<Record<ComponentType, IconComponent>>
}
