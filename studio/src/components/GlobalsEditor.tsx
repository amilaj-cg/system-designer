import { useStore } from '../store'

export function GlobalsEditor() {
  const globals = useStore((s) => s.globals)
  const setGlobals = useStore((s) => s.setGlobals)

  const rows: { key: keyof typeof globals; label: string; step: number; help: string }[] = [
    { key: 'writeRatio', label: 'Write ratio', step: 0.05, help: 'Fraction of requests that are writes (drives DB read/write split).' },
    { key: 'rpsPerUser', label: 'Default req/s per user', step: 0.01, help: 'Fallback for Users nodes that don’t set their own.' },
    { key: 'peakRatio', label: 'Default peak ×', step: 0.5, help: 'Fallback peak ÷ average (guide: 3–4×).' },
    { key: 'targetUsers', label: 'Default users', step: 1000, help: 'Fallback population for entry nodes that don’t set their own.' },
  ]

  return (
    <div className="px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-muted mb-2">Global defaults</div>
      <p className="text-[10.5px] text-muted mb-2 leading-snug">
        Write ratio is system-wide. The rest are fallbacks — each Users/Client node can override them.
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <label key={r.key} className="block" title={r.help}>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-ink">{r.label}</span>
              <input
                type="number"
                step={r.step}
                min={0}
                className="w-24 bg-panel2 border border-line rounded-lg px-2 py-1 text-[12px] text-ink text-right focus:outline-none focus:border-accent"
                value={globals[r.key]}
                onChange={(e) => setGlobals({ [r.key]: Number(e.target.value) } as any)}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
