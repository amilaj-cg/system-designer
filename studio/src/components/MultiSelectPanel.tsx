import { useStore } from '../store'
import type { AlignAxis } from '../store'

export function MultiSelectPanel() {
  const count = useStore((s) => s.selectedIds.length)
  const align = useStore((s) => s.alignSelection)
  const duplicate = useStore((s) => s.duplicateSelection)
  const del = useStore((s) => s.deleteSelection)

  return (
    <div className="w-72 shrink-0 border-l border-line bg-panel flex flex-col">
      <div className="px-4 py-3 border-b border-line text-[13px] font-semibold text-ink">
        {count} components selected
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-2">Align</div>
          <div className="grid grid-cols-3 gap-1.5">
            <AlignBtn axis="left" align={align} title="Align left">⌫ L</AlignBtn>
            <AlignBtn axis="centerX" align={align} title="Center horizontally">↔ C</AlignBtn>
            <AlignBtn axis="right" align={align} title="Align right">R ⌦</AlignBtn>
            <AlignBtn axis="top" align={align} title="Align top">⌅ T</AlignBtn>
            <AlignBtn axis="centerY" align={align} title="Center vertically">↕ C</AlignBtn>
            <AlignBtn axis="bottom" align={align} title="Align bottom">B ⌅</AlignBtn>
          </div>
          <p className="text-[10.5px] text-muted mt-2 leading-snug">
            Aligns the selected components along the chosen edge or center.
          </p>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-2">Actions</div>
          <button
            onClick={duplicate}
            className="w-full text-[12px] text-ink border border-line hover:border-accent rounded-lg py-1.5 mb-2"
          >
            Duplicate selection (⌘D)
          </button>
          <button
            onClick={del}
            className="w-full text-[12px] text-bad border border-line hover:border-bad rounded-lg py-1.5"
          >
            Delete selection (⌫)
          </button>
        </div>
      </div>
    </div>
  )
}

function AlignBtn({
  axis,
  align,
  title,
  children,
}: {
  axis: AlignAxis
  align: (a: AlignAxis) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => align(axis)}
      title={title}
      className="text-[12px] text-ink bg-panel2 border border-line hover:border-accent rounded-lg py-1.5"
    >
      {children}
    </button>
  )
}
