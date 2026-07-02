import { useRef, useState } from 'react'
import { useStore } from '../store'
import { listThemes } from '../themes'
import { downloadDesign, exportPng, readDesignFile } from '../lib/export'
import { sampleDesign } from '../lib/sample'
import { buildShareUrl, copyToClipboard } from '../lib/share'

export function Toolbar({ onToggleReport }: { onToggleReport: () => void }) {
  const name = useStore((s) => s.name)
  const setName = useStore((s) => s.setName)
  const themeId = useStore((s) => s.themeId)
  const setTheme = useStore((s) => s.setTheme)
  const toDesign = useStore((s) => s.toDesign)
  const loadDesign = useStore((s) => s.loadDesign)
  const reset = useStore((s) => s.reset)
  const nodes = useStore((s) => s.nodes)
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  const themes = listThemes()

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const design = await readDesignFile(file)
      loadDesign(design)
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  const onExportPng = async () => {
    if (!nodes.length) return alert('Add some components first.')
    setBusy('png')
    try {
      await exportPng(nodes, name)
    } catch (err) {
      alert(`PNG export failed: ${(err as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const onShare = async () => {
    if (!nodes.length) return alert('Add some components first.')
    const url = buildShareUrl(toDesign())
    const ok = await copyToClipboard(url)
    // ~2000 chars is the practical safe limit across browsers/servers.
    const tooLong = url.length > 8000
    setShareMsg(
      ok
        ? tooLong
          ? 'Link copied — but it is large; consider Save .json'
          : 'Share link copied to clipboard'
        : 'Copy failed — use Save .json instead',
    )
    setTimeout(() => setShareMsg(null), 3500)
  }

  const loadSample = () => {
    const { nodes: sn, edges: se } = sampleDesign()
    loadDesign({
      app: 'system-designer-studio',
      version: 1,
      name: 'RAG web app (sample)',
      theme: themeId,
      globals: useStore.getState().globals,
      nodes: sn,
      edges: se,
    })
  }

  return (
    <header className="relative h-12 shrink-0 border-b border-line bg-panel flex items-center gap-2 px-3">
      <div className="flex items-center gap-2 mr-1">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-accent to-accent2" />
        <span className="text-[13px] font-semibold text-ink hidden sm:block">System Designer Studio</span>
      </div>

      <input
        className="bg-panel2 border border-line rounded-lg px-2.5 py-1 text-[12.5px] text-ink w-48 focus:outline-none focus:border-accent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Design name"
      />

      <div className="flex items-center rounded-lg border border-line overflow-hidden ml-1">
        <ViewTab active={view === 'graph'} onClick={() => setView('graph')}>
          ◈ Graph
        </ViewTab>
        <ViewTab active={view === 'json'} onClick={() => setView('json')}>
          {'{ }'} JSON
        </ViewTab>
      </div>

      <div className="flex-1" />

      <select
        className="bg-panel2 border border-line rounded-lg px-2 py-1 text-[12px] text-ink focus:outline-none focus:border-accent"
        value={themeId}
        onChange={(e) => setTheme(e.target.value)}
        title="Icon theme"
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.vendor} · {t.name}
          </option>
        ))}
      </select>

      <Btn onClick={loadSample}>Sample</Btn>
      <Btn onClick={() => reset()}>New</Btn>
      <Btn onClick={() => fileInput.current?.click()}>Open</Btn>
      <Btn onClick={() => downloadDesign(toDesign())}>Save .json</Btn>
      <Btn onClick={onShare}>Share link</Btn>
      <Btn onClick={onExportPng} disabled={busy === 'png'}>
        {busy === 'png' ? 'Exporting…' : 'Export PNG'}
      </Btn>
      <Btn primary onClick={onToggleReport}>
        Report
      </Btn>

      <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={onImport} />

      {shareMsg && (
        <div className="absolute right-3 top-12 mt-1 z-50 rounded-lg border border-line bg-panel2 px-3 py-1.5 text-[12px] text-ink shadow-lg">
          {shareMsg}
        </div>
      )}
    </header>
  )
}

function ViewTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        'text-[12px] px-3 py-1.5 ' +
        (active ? 'bg-accent text-canvas font-semibold' : 'bg-panel2 text-ink hover:bg-line')
      }
    >
      {children}
    </button>
  )
}

function Btn({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'text-[12px] rounded-lg px-2.5 py-1.5 border disabled:opacity-50 ' +
        (primary
          ? 'bg-accent text-canvas border-transparent font-semibold hover:brightness-110'
          : 'bg-panel2 text-ink border-line hover:border-accent')
      }
    >
      {children}
    </button>
  )
}
