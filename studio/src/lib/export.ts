import { toPng } from 'html-to-image'
import {
  getNodesBounds,
  getViewportForBounds,
  type Viewport,
} from '@xyflow/react'
import type { DesignFile, DesignNode } from '../types'

export function downloadDesign(design: DesignFile): void {
  const data = { ...design, savedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${slug(design.name)}.sysdesign.json`)
}

export function readDesignFile(file: File): Promise<DesignFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DesignFile
        if (parsed.app !== 'system-designer-studio') {
          reject(new Error('Not a System Designer Studio file.'))
          return
        }
        resolve(parsed)
      } catch (e) {
        reject(e as Error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** Render the current graph to a PNG data URL, framed to fit all nodes. */
export async function renderDiagramPng(
  nodes: DesignNode[],
  background = '#0f1320',
  width = 1600,
  height = 1000,
): Promise<string> {
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (!viewportEl) throw new Error('Canvas not found.')

  const bounds = getNodesBounds(nodes)
  const vp: Viewport = getViewportForBounds(bounds, width, height, 0.4, 2, 0.12)

  return toPng(viewportEl, {
    backgroundColor: background,
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
    },
  })
}

/** Render the current graph to a PNG file download. */
export async function exportPng(nodes: DesignNode[], name: string, background = '#0f1320'): Promise<void> {
  const dataUrl = await renderDiagramPng(nodes, background)
  const blob = await (await fetch(dataUrl)).blob()
  triggerDownload(blob, `${slug(name)}.png`)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slug(s: string): string {
  return (s || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'design'
}
