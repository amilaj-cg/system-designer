import { NodeResizer, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { getDef } from '../catalog'
import { componentIcon } from '../themes'
import { useStore } from '../store'
import type { DesignNode } from '../types'

function GroupNodeImpl({ data, selected }: NodeProps<DesignNode>) {
  const themeId = useStore((s) => s.themeId)
  const def = getDef(data.type)
  const Icon = componentIcon(themeId, data.type)
  const kind = (data.config?.kind as string) || (data.config?.orchestrator as string) || (data.config?.os as string)

  return (
    <div
      className="w-full h-full rounded-xl border-2 border-dashed"
      style={{
        borderColor: selected ? def.accent : `${def.accent}80`,
        background: `${def.accent}12`,
      }}
    >
      <NodeResizer
        minWidth={180}
        minHeight={120}
        isVisible={!!selected}
        color={def.accent}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: def.accent }}
      />
      <div
        className="inline-flex items-center gap-1.5 m-2 px-2 py-1 rounded-lg bg-panel/90 border"
        style={{ borderColor: `${def.accent}55` }}
      >
        <span style={{ color: def.accent }}>
          <Icon size={16} />
        </span>
        <span className="text-[11.5px] font-semibold text-ink leading-none">{data.label}</span>
        {kind && <span className="text-[10px] text-muted leading-none">· {kind}</span>}
      </div>
    </div>
  )
}

export const GroupNode = memo(GroupNodeImpl)
