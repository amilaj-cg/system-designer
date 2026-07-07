import { useMemo, useState } from 'react'
import { listComponents } from '../catalog'
import { componentIcon } from '../themes'
import { useStore } from '../store'
import type { ComponentDef, ComponentType } from '../types'

export function Palette() {
  const themeId = useStore((s) => s.themeId)
  const [query, setQuery] = useState('')

  const all = listComponents()
  const q = query.trim().toLowerCase()

  // Collapsible pack sections — first section expanded by default.
  const firstGroup = all[0]?.group ?? ''
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ [firstGroup]: true }))
  const toggle = (g: string) => setOpen((o) => ({ ...o, [g]: !o[g] }))

  // Group by pack (group) → category, preserving registration order.
  const grouped = useMemo(() => {
    const filtered = q
      ? all.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || (c.group ?? '').toLowerCase().includes(q))
      : all
    const byGroup = new Map<string, Map<string, ComponentDef[]>>()
    for (const c of filtered) {
      const g = c.group ?? 'Other'
      if (!byGroup.has(g)) byGroup.set(g, new Map())
      const cats = byGroup.get(g)!
      if (!cats.has(c.category)) cats.set(c.category, [])
      cats.get(c.category)!.push(c)
    }
    return byGroup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, all.length])

  const onDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/sysdesign', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-56 shrink-0 border-r border-line bg-panel flex flex-col">
      <div className="px-3 py-2.5 border-b border-line">
        <div className="text-[13px] font-semibold text-ink">Components</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="mt-2 w-full bg-panel2 border border-line rounded-lg px-2.5 py-1 text-[12px] text-ink focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-2 py-2 space-y-2">
        {Array.from(grouped.entries()).map(([group, cats]) => {
          // While searching, force every matching section open.
          const expanded = q ? true : !!open[group]
          const count = Array.from(cats.values()).reduce((n, items) => n + items.length, 0)
          return (
          <div key={group}>
            <button
              onClick={() => toggle(group)}
              className="w-full px-1.5 py-1 flex items-center gap-1.5 rounded-lg hover:bg-panel2"
              aria-expanded={expanded}
            >
              <span className={'text-muted transition-transform ' + (expanded ? 'rotate-90' : '')}>▸</span>
              <span className="text-[11px] font-semibold text-ink">{group}</span>
              <span className="ml-auto text-[10px] text-muted">{count}</span>
            </button>
            {expanded &&
            Array.from(cats.entries()).map(([cat, items]) => (
              <div key={cat} className="mb-1.5">
                <div className="px-1 pb-0.5 text-[10px] uppercase tracking-wider text-muted">{cat}</div>
                <div className="space-y-1">
                  {items.map((c) => {
                    const Icon = componentIcon(themeId, c.type)
                    return (
                      <div
                        key={c.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, c.type)}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-transparent hover:border-line hover:bg-panel2 cursor-grab active:cursor-grabbing"
                        title={c.blurb}
                      >
                        <span style={{ color: c.accent }}>
                          <Icon size={20} />
                        </span>
                        <span className="text-[12px] text-ink leading-tight">{c.label}</span>
                        {c.isContainer && <span className="ml-auto text-[9px] text-muted border border-line rounded px-1">group</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          )
        })}
        {grouped.size === 0 && <div className="px-2 py-4 text-[12px] text-muted">No components match “{query}”.</div>}
      </div>
      <div className="px-3 py-2 border-t border-line text-[10.5px] text-muted">
        Drag onto the canvas. Drop a component onto a VM/Cluster/Boundary to place it inside.
      </div>
    </div>
  )
}
