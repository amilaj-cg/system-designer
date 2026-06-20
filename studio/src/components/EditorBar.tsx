import { useState } from 'react'
import { useStore } from '../store'

const GRID_OPTIONS = [10, 16, 20, 24, 40]

export function EditorBar() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const snapToGrid = useStore((s) => s.snapToGrid)
  const toggleSnap = useStore((s) => s.toggleSnap)
  const gridSize = useStore((s) => s.gridSize)
  const setGridSize = useStore((s) => s.setGridSize)
  const mode = useStore((s) => s.selectionMode)
  const setMode = useStore((s) => s.setSelectionMode)
  const selCount = useStore((s) => s.selectedIds.length)
  const [help, setHelp] = useState(false)

  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-xl border border-line bg-panel/95 backdrop-blur px-1.5 py-1 shadow-lg">
        <Tool label="Undo" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
          ↶
        </Tool>
        <Tool label="Redo" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">
          ↷
        </Tool>

        <Sep />

        <div className="flex rounded-lg overflow-hidden border border-line">
          <Seg active={mode === 'pan'} onClick={() => setMode('pan')} title="Pan — drag to move canvas (Shift-drag to box-select)">
            ✥ Pan
          </Seg>
          <Seg active={mode === 'select'} onClick={() => setMode('select')} title="Select — drag to box-select nodes">
            ▭ Select
          </Seg>
        </div>

        <Sep />

        <Seg active={snapToGrid} onClick={toggleSnap} title="Snap nodes to grid" standalone>
          # Snap
        </Seg>
        <select
          className="bg-panel2 border border-line rounded-lg px-1.5 py-1 text-[11px] text-ink focus:outline-none focus:border-accent disabled:opacity-50"
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          disabled={!snapToGrid}
          title="Grid size"
        >
          {GRID_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}px
            </option>
          ))}
        </select>

        <Sep />

        <Tool label="Shortcuts" onClick={() => setHelp((v) => !v)} title="Keyboard shortcuts">
          ?
        </Tool>
      </div>

      {selCount > 1 && (
        <div className="rounded-lg border border-accent/50 bg-accent/10 px-2.5 py-1 text-[11.5px] text-accent shadow-lg">
          {selCount} selected
        </div>
      )}

      {help && <ShortcutsPopover onClose={() => setHelp(false)} />}
    </div>
  )
}

function Tool({
  children,
  onClick,
  disabled,
  title,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className="h-7 min-w-7 px-1.5 rounded-lg text-[14px] text-ink hover:bg-panel2 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

function Seg({
  children,
  active,
  onClick,
  title,
  standalone,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title?: string
  standalone?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        'h-7 px-2 text-[11.5px] ' +
        (standalone ? 'rounded-lg border border-line ' : '') +
        (active ? 'bg-accent text-canvas font-semibold' : 'bg-panel2 text-ink hover:bg-line')
      }
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-line mx-0.5" />
}

const SHORTCUTS: [string, string][] = [
  ['Drag from palette', 'Add a component'],
  ['Drag handle → handle', 'Wire two components'],
  ['Shift-drag / Select mode', 'Box-select an area'],
  ['Shift-click', 'Add to selection'],
  ['⌘A', 'Select all'],
  ['⌘C / ⌘V', 'Copy / paste'],
  ['⌘D', 'Duplicate selection'],
  ['Delete / Backspace', 'Delete selection'],
  ['⌘Z / ⌘⇧Z', 'Undo / redo'],
  ['Esc', 'Clear selection'],
]

function ShortcutsPopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute left-0 top-11 w-72 rounded-xl border border-line bg-panel shadow-2xl p-3 z-20">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12.5px] font-semibold text-ink">Keyboard & mouse</div>
        <button className="text-muted hover:text-ink leading-none" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="space-y-1">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-muted">{v}</span>
            <kbd className="text-[10.5px] text-ink bg-panel2 border border-line rounded px-1.5 py-0.5 whitespace-nowrap">{k}</kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
