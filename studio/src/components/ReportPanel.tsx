import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useAnalysis } from '../lib/analysisContext'
import { fmtMult, fmtUsers } from '../capacity'
import { buildReportHtml, buildReportMarkdown, downloadMarkdown, printReportHtml } from '../lib/report'
import { renderDiagramPng } from '../lib/export'

function rps(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k req/s`
  return `${Math.round(n)} req/s`
}
function utilColor(u: number): string {
  if (u >= 1) return '#ff7a7a'
  if (u >= 0.75) return '#ffcf66'
  return '#5bd98a'
}

export function ReportPanel({ onClose }: { onClose: () => void }) {
  const analysis = useAnalysis()
  const name = useStore((s) => s.name)
  const globals = useStore((s) => s.globals)
  const nodes = useStore((s) => s.nodes)
  const [printing, setPrinting] = useState(false)

  const md = useMemo(
    () => (analysis ? buildReportMarkdown(name, analysis, globals) : ''),
    [analysis, name, globals],
  )

  const onPrint = async () => {
    if (!analysis) return
    setPrinting(true)
    try {
      // Embed the diagram if there's anything to render; print regardless.
      let diagram: string | undefined
      try {
        if (nodes.length) diagram = await renderDiagramPng(nodes)
      } catch {
        diagram = undefined
      }
      printReportHtml(buildReportHtml(name, analysis, globals, diagram))
    } finally {
      setPrinting(false)
    }
  }

  if (!analysis) return null

  const onPath = analysis.nodes.filter((n) => n.onPath && n.capacity != null)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-[560px] max-w-full h-full bg-panel border-l border-line flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 shrink-0 border-b border-line flex items-center justify-between px-4">
          <div className="text-[14px] font-semibold text-ink">Capacity report</div>
          <div className="flex items-center gap-2">
            <button
              className="text-[12px] rounded-lg px-2.5 py-1.5 border border-line bg-panel2 text-ink hover:border-accent"
              onClick={() => downloadMarkdown(name, md)}
            >
              Download .md
            </button>
            <button
              className="text-[12px] rounded-lg px-2.5 py-1.5 border border-line bg-panel2 text-ink hover:border-accent disabled:opacity-50"
              onClick={onPrint}
              disabled={printing}
            >
              {printing ? 'Preparing…' : 'Print / PDF'}
            </button>
            <button className="text-muted hover:text-ink text-lg leading-none px-1" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
          {/* Headline */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Traffic headroom" value={fmtMult(analysis.scaleMultiplier)} accent="#6ea8fe" />
            {analysis.sources.some((s) => s.mode === 'population') ? (
              <Stat label="Max users" value={fmtUsers(analysis.maxUsers)} accent="#5fd0c3" />
            ) : (
              <Stat label="Configured peak" value={rps(analysis.configuredPeakRps)} accent="#5fd0c3" />
            )}
            <Stat label="Infra cost" value={`$${analysis.totalMonthlyCost.toLocaleString()}/mo`} accent="#ffcf66" />
          </div>

          <div className="rounded-lg border border-line bg-panel2 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted">Bottleneck</div>
            <div className="text-[15px] font-semibold mt-0.5" style={{ color: '#ff7a7a' }}>
              {analysis.bottleneckLabel ?? 'No constrained component on the path'}
            </div>
            <p className="text-[12px] text-muted mt-1 leading-snug">
              Saturates first — the system can grow {fmtMult(analysis.scaleMultiplier)} before it does. Add
              instances/replicas or raise its limits to lift the ceiling.
            </p>
          </div>

          {analysis.warnings.length > 0 && (
            <div className="rounded-lg border border-warn/40 bg-warn/10 p-3 space-y-1">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="text-[12px] text-warn leading-snug">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          {/* Traffic sources */}
          {analysis.sources.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-2">Traffic sources</div>
              <div className="space-y-2">
                {analysis.sources.map((s) => (
                  <div key={s.id} className="rounded-lg border border-line bg-panel2 p-2.5 flex items-baseline justify-between">
                    <div>
                      <span className="text-[12.5px] text-ink font-medium">{s.label}</span>
                      <span className="text-[10.5px] text-muted ml-2">
                        {s.mode === 'population' ? `${fmtUsers(s.users ?? 0)} users` : rps(s.rps ?? 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted">{rps(s.peakRps)} peak in</div>
                      <div className="text-[11.5px] text-ink">
                        max {s.mode === 'population' ? `${fmtUsers(s.maxUsers ?? 0)} users` : rps(s.maxRps ?? 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-component table */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted mb-2">Per-component utilization</div>
            <div className="space-y-2">
              {onPath
                .slice()
                .sort((a, b) => b.utilization - a.utilization)
                .map((n) => (
                  <div key={n.id} className="rounded-lg border border-line bg-panel2 p-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12.5px] text-ink font-medium">{n.label}</span>
                      <span className="text-[11px] text-muted">{rps(n.capacity)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-canvas overflow-hidden my-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(n.utilization * 100, 100)}%`, background: utilColor(n.utilization) }}
                      />
                    </div>
                    <div className="flex justify-between text-[10.5px] text-muted">
                      <span>{Math.round(n.utilization * 100)}% at configured mix</span>
                      <span>{fmtMult(n.headroom)} headroom</span>
                    </div>
                  </div>
                ))}
              {onPath.length === 0 && (
                <div className="text-[12px] text-muted">Wire a traffic source to your components to see utilization.</div>
              )}
            </div>
          </div>

          {/* Raw markdown for audit */}
          <details className="rounded-lg border border-line bg-panel2 p-3">
            <summary className="text-[12px] text-ink cursor-pointer">Full report (markdown)</summary>
            <pre className="text-[11px] text-muted whitespace-pre-wrap mt-2 font-mono leading-relaxed">{md}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel2 p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-[20px] font-bold mt-1" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}
