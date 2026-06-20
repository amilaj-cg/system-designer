import LZString from 'lz-string'
import type { DesignFile } from '../types'

const HASH_KEY = 'd'

/**
 * Self-contained sharing: the entire design is compressed and packed into the
 * URL hash, so a link works with no server or storage. lz-string's
 * encoded-URI-component variant keeps the payload URL-safe.
 */
export function encodeDesign(design: DesignFile): string {
  // Drop volatile fields so the same design yields a stable link.
  const clean: DesignFile = { ...design, savedAt: undefined }
  return LZString.compressToEncodedURIComponent(JSON.stringify(clean))
}

export function decodeDesign(encoded: string): DesignFile | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json) as DesignFile
    if (parsed.app !== 'system-designer-studio') return null
    return parsed
  } catch {
    return null
  }
}

export function buildShareUrl(design: DesignFile): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}#${HASH_KEY}=${encodeDesign(design)}`
}

/** Read a shared design from the current URL hash, if present. */
export function readDesignFromHash(): DesignFile | null {
  const hash = location.hash.replace(/^#/, '')
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const enc = params.get(HASH_KEY)
  if (!enc) return null
  return decodeDesign(enc)
}

/** Remove the design payload from the address bar without reloading. */
export function clearShareHash(): void {
  history.replaceState(null, '', `${location.pathname}${location.search}`)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for non-secure contexts.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
