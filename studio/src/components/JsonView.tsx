import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { copyToClipboard } from '../lib/share'
import type { DesignFile } from '../types'

/**
 * Live JSON representation of the design. Read-only by default; edits become a
 * "draft" that you Apply (parsed + validated) back into the graph, or Revert.
 * While not dirty, it stays in sync with the canvas so switching views always
 * shows the current design.
 */
export function JsonView() {
  const toDesign = useStore((s) => s.toDesign)
  const loadDesign = useStore((s) => s.loadDesign)
  // Subscribe to the slices that affect the serialized design so it stays live.
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const name = useStore((s) => s.name)
  const themeId = useStore((s) => s.themeId)
  const globals = useStore((s) => s.globals)

  const current = useMemo(
    () => JSON.stringify(toDesign(), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, edges, name, themeId, globals],
  )

  const [draft, setDraft] = useState(current)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Keep the editor in sync with the canvas while the user hasn't edited.
  useEffect(() => {
    if (!dirty) setDraft(current)
  }, [current, dirty])

  const onChange = (v: string) => {
    setDraft(v)
    setDirty(v !== current)
    try {
      JSON.parse(v)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const apply = () => {
    let parsed: DesignFile
    try {
      parsed = JSON.parse(draft)
    } catch (e) {
      setError((e as Error).message)
      return
    }
    if (parsed?.app !== 'system-designer-studio') {
      setError('Not a System Designer Studio design — the "app" field must be "system-designer-studio".')
      return
    }
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      setError('Invalid design — "nodes" and "edges" must be arrays.')
      return
    }
    loadDesign(parsed)
    setDirty(false)
    setError(null)
  }

  const revert = () => {
    setDraft(current)
    setDirty(false)
    setError(null)
  }

  const copy = async () => {
    const ok = await copyToClipboard(draft)
    setCopied(ok)
    setTimeout(() => setCopied(false), 1500)
  }

  const lineCount = draft.split('\n').length

  return (
    <div className="absolute inset-0 flex flex-col bg-canvas">
      <div className="h-10 shrink-0 border-b border-line bg-panel flex items-center gap-2 px-3">
        <span className="text-[12px] text-muted">
          design.json · {nodes.length} nodes · {edges.length} edges · {lineCount} lines
        </span>
        <div className="flex-1" />
        {dirty && <span className="text-[11px] text-warn">unsaved edits</span>}
        {error && !dirty && <span className="text-[11px] text-bad">invalid</span>}
        <BarBtn onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</BarBtn>
        <BarBtn onClick={revert} disabled={!dirty}>
          Revert
        </BarBtn>
        <BarBtn onClick={apply} disabled={!dirty || !!error} primary>
          Apply changes
        </BarBtn>
      </div>

      <div className="flex-1 min-h-0 relative">
        <textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="absolute inset-0 w-full h-full resize-none bg-canvas text-ink font-mono text-[12.5px] leading-relaxed p-4 scroll-thin focus:outline-none"
          style={{ tabSize: 2 }}
        />
      </div>

      {error && (
        <div className="shrink-0 border-t border-bad/40 bg-bad/10 px-4 py-2 text-[11.5px] text-bad font-mono">
          JSON error: {error}
        </div>
      )}
      <div className="shrink-0 border-t border-line bg-panel px-4 py-1.5 text-[11px] text-muted">
        Edit the design as JSON and press <b className="text-ink">Apply changes</b> to load it back into the canvas. This is the
        same format as <span className="text-ink">Save .json</span> / <span className="text-ink">Open</span>.
      </div>
    </div>
  )
}

function BarBtn({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'text-[12px] rounded-lg px-2.5 py-1 border disabled:opacity-40 ' +
        (primary
          ? 'bg-accent text-canvas border-transparent font-semibold hover:brightness-110'
          : 'bg-panel2 text-ink border-line hover:border-accent')
      }
    >
      {children}
    </button>
  )
}
