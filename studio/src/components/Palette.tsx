import { CATALOG_LIST } from '../catalog'
import { getIcon } from '../themes'
import { useStore } from '../store'
import type { ComponentType } from '../types'

export function Palette() {
  const themeId = useStore((s) => s.themeId)

  const categories = Array.from(new Set(CATALOG_LIST.map((c) => c.category)))

  const onDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/sysdesign', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-56 shrink-0 border-r border-line bg-panel flex flex-col">
      <div className="px-3 py-3 border-b border-line">
        <div className="text-[13px] font-semibold text-ink">Components</div>
        <div className="text-[11px] text-muted">Drag onto the canvas</div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-2 py-2 space-y-3">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="px-1 pb-1 text-[10.5px] uppercase tracking-wider text-muted">{cat}</div>
            <div className="space-y-1">
              {CATALOG_LIST.filter((c) => c.category === cat).map((c) => {
                const Icon = getIcon(themeId, c.type)
                return (
                  <div
                    key={c.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, c.type)}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-transparent hover:border-line hover:bg-panel2 cursor-grab active:cursor-grabbing"
                    title={c.blurb}
                  >
                    <span style={{ color: c.accent }}>
                      <Icon size={22} />
                    </span>
                    <span className="text-[12.5px] text-ink">{c.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-line text-[10.5px] text-muted">
        Tip: connect a node's right handle to the next node's left handle to wire the flow.
      </div>
    </div>
  )
}
