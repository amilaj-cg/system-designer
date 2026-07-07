import { getDef } from '../catalog'
import { useStore } from '../store'
import { useAnalysis, useNodeAnalysis } from '../lib/analysisContext'
import { fmtMult } from '../capacity'
import { componentIcon } from '../themes'
import type { FieldDef } from '../types'
import { GlobalsEditor } from './GlobalsEditor'
import { MultiSelectPanel } from './MultiSelectPanel'

export function ConfigPanel() {
  // All hooks must run unconditionally (Rules of Hooks) before any early return.
  const multi = useStore((s) => s.selectedIds.length > 1)
  const selectedId = useStore((s) => s.selectedId)
  const node = useStore((s) => s.nodes.find((n) => n.id === s.selectedId) || null)
  const updateNodeConfig = useStore((s) => s.updateNodeConfig)
  const renameNode = useStore((s) => s.renameNode)
  const deleteNode = useStore((s) => s.deleteNode)
  const themeId = useStore((s) => s.themeId)
  const analysis = useNodeAnalysis(selectedId || '')
  const system = useAnalysis()

  if (multi) return <MultiSelectPanel />

  if (!node) {
    return (
      <div className="w-72 shrink-0 border-l border-line bg-panel flex flex-col">
        <div className="px-4 py-3 border-b border-line text-[13px] font-semibold text-ink">Inspector</div>
        <div className="px-4 py-4 text-[12.5px] text-muted">
          Select a component to configure it. Every field has a sensible default, so you can wire a system and
          simulate immediately.
        </div>
        <div className="mt-auto border-t border-line">
          <GlobalsEditor />
        </div>
      </div>
    )
  }

  const def = getDef(node.data.type)
  const Icon = componentIcon(themeId, node.data.type)
  const source = system?.sources.find((s) => s.id === node.id)

  return (
    <div className="w-72 shrink-0 border-l border-line bg-panel flex flex-col">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <span style={{ color: def.accent }}>
          <Icon size={22} />
        </span>
        <div className="text-[13px] font-semibold text-ink">{def.label}</div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3">
        <p className="text-[11.5px] text-muted leading-snug">{def.blurb}</p>

        <Field label="Name">
          <input
            className="w-full bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-accent"
            value={node.data.label}
            onChange={(e) => renameNode(node.id, e.target.value)}
          />
        </Field>

        {def.fields
          .filter((f) => !f.showIf || f.showIf(node.data.config))
          .map((f) => (
            <ConfigField
              key={f.key}
              field={f}
              value={node.data.config[f.key]}
              onChange={(v) => updateNodeConfig(node.id, f.key, v)}
            />
          ))}

        {source && (
          <div className="rounded-lg border border-line bg-panel2 p-2.5 mt-2">
            <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1">Traffic source</div>
            <div className="text-[13px] font-semibold text-ink">{fmtRps(source.peakRps)} at peak</div>
            <div className="text-[11px] text-muted mt-1 leading-snug">
              {source.mode === 'population'
                ? `${fmtUsers(source.users ?? 0)} users emitting into the system.`
                : `Fixed API/service rate into the system.`}
            </div>
            <div className="text-[11px] mt-1.5 text-muted">
              At the system limit: up to{' '}
              <b className="text-ink">
                {source.mode === 'population' ? `${fmtUsers(source.maxUsers ?? 0)} users` : `${fmtRps(source.maxRps ?? 0)}`}
              </b>
            </div>
          </div>
        )}

        {analysis && analysis.capacity != null && (
          <div className="rounded-lg border border-line bg-panel2 p-2.5 mt-2">
            <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1">Capacity</div>
            <div className="text-[13px] font-semibold text-ink">{fmtRps(analysis.capacity)} sustained</div>
            <div className="text-[11px] text-muted mt-1 leading-snug">{analysis.capacityNote}</div>
            {analysis.onPath && (
              <div className="text-[11px] mt-1.5" style={{ color: analysis.utilization >= 1 ? '#ff7a7a' : '#97a1bd' }}>
                {Math.round(analysis.utilization * 100)}% utilized at the configured mix · {fmtMult(analysis.headroom)} headroom
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line">
        <button
          onClick={() => deleteNode(node.id)}
          className="w-full text-[12px] text-bad border border-line hover:border-bad rounded-lg py-1.5"
        >
          Delete component
        </button>
      </div>
    </div>
  )
}

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any
  onChange: (v: number | string) => void
}) {
  return (
    <Field label={field.label} unit={field.unit} help={field.help}>
      {field.type === 'select' ? (
        <select
          className="w-full bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-accent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === 'number' ? (
        <input
          type="number"
          min={field.min}
          step={field.step}
          className="w-full bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-accent"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        />
      ) : (
        <input
          className="w-full bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-accent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  )
}

function Field({
  label,
  unit,
  help,
  children,
}: {
  label: string
  unit?: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11.5px] text-ink">{label}</span>
        {unit && <span className="text-[10.5px] text-muted">{unit}</span>}
      </div>
      {children}
      {help && <div className="text-[10.5px] text-muted mt-1 leading-snug">{help}</div>}
    </label>
  )
}

function fmtRps(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k req/s`
  return `${Math.round(n)} req/s`
}
function fmtUsers(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(Math.round(n))
}
