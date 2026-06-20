import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { CATALOG } from '../catalog'
import { getIcon } from '../themes'
import { useStore } from '../store'
import { useNodeAnalysis, useAnalysis } from '../lib/analysisContext'
import type { DesignNode } from '../types'

function utilColor(u: number): string {
  if (u >= 1) return '#ff7a7a'
  if (u >= 0.75) return '#ffcf66'
  return '#5bd98a'
}

function ComponentNodeImpl({ id, data, selected }: NodeProps<DesignNode>) {
  const themeId = useStore((s) => s.themeId)
  const def = CATALOG[data.type]
  const Icon = getIcon(themeId, data.type)
  const analysis = useNodeAnalysis(id)
  const system = useAnalysis()
  const isBottleneck = system?.bottleneckId === id

  const util = analysis?.utilization ?? 0
  const showBar = analysis?.capacity != null && analysis.onPath

  return (
    <div
      className="rounded-xl border bg-panel2 shadow-lg w-[168px] select-none"
      style={{
        borderColor: selected ? def.accent : isBottleneck ? '#ff7a7a' : '#2a3350',
        boxShadow: isBottleneck ? '0 0 0 2px rgba(255,122,122,.45)' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <span style={{ color: def.accent }}>
          <Icon size={26} />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight truncate text-ink">{data.label}</div>
          <div className="text-[10.5px] text-muted leading-tight">{def.label}</div>
        </div>
      </div>

      {showBar && (
        <div className="px-3 pb-2.5 pt-2">
          <div className="h-1.5 rounded-full bg-[#0f1320] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(util * 100, 100)}%`, background: utilColor(util) }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>{Math.round(util * 100)}% load</span>
            <span style={{ color: isBottleneck ? '#ff7a7a' : undefined }}>
              {isBottleneck ? 'bottleneck' : capLabel(analysis?.capacity)}
            </span>
          </div>
        </div>
      )}
      {!showBar && <div className="pb-2.5" />}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function capLabel(cap?: number | null): string {
  if (cap == null) return ''
  if (cap >= 1000) return `${(cap / 1000).toFixed(cap >= 10000 ? 0 : 1)}k r/s`
  return `${Math.round(cap)} r/s`
}

export const ComponentNode = memo(ComponentNodeImpl)
