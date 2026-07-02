import { useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useStore } from './store'
import { analyze } from './capacity'
import { clearShareHash, readDesignFromHash } from './lib/share'
import { useEditorShortcuts } from './lib/useEditorShortcuts'
import { AnalysisContext } from './lib/analysisContext'
import { Toolbar } from './components/Toolbar'
import { Palette } from './components/Palette'
import { Canvas } from './components/Canvas'
import { JsonView } from './components/JsonView'
import { ConfigPanel } from './components/ConfigPanel'
import { ReportPanel } from './components/ReportPanel'
import { fmtUsers } from './capacity'

export default function App() {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const globals = useStore((s) => s.globals)
  const view = useStore((s) => s.view)
  const [showReport, setShowReport] = useState(false)
  const loadDesign = useStore((s) => s.loadDesign)

  useEditorShortcuts()

  // Load a shared design from the URL hash on first mount, then clean the URL.
  useEffect(() => {
    const shared = readDesignFromHash()
    if (shared) {
      loadDesign(shared)
      clearShareHash()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const analysis = useMemo(() => analyze(nodes, edges, globals), [nodes, edges, globals])

  return (
    <AnalysisContext.Provider value={analysis}>
      <ReactFlowProvider>
        <div className="h-full flex flex-col">
          <Toolbar onToggleReport={() => setShowReport(true)} />
          <div className="flex-1 flex min-h-0">
            {view === 'graph' && <Palette />}
            <div className="flex-1 relative min-w-0">
              {view === 'graph' ? (
                <>
                  <Canvas />
                  <SummaryPill maxUsers={analysis.maxUsers} bottleneck={analysis.bottleneckLabel} count={nodes.length} />
                </>
              ) : (
                <JsonView />
              )}
            </div>
            {view === 'graph' && <ConfigPanel />}
          </div>
        </div>
        {showReport && <ReportPanel onClose={() => setShowReport(false)} />}
      </ReactFlowProvider>
    </AnalysisContext.Provider>
  )
}

function SummaryPill({
  maxUsers,
  bottleneck,
  count,
}: {
  maxUsers: number
  bottleneck: string | null
  count: number
}) {
  if (count === 0) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-none">
        <div className="rounded-full bg-panel/90 border border-line px-4 py-1.5 text-[12px] text-muted">
          Drag components from the left, then wire them to simulate capacity.
        </div>
      </div>
    )
  }
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 pointer-events-none">
      <div className="rounded-full bg-panel/95 border border-line px-4 py-1.5 text-[12.5px] text-ink shadow-lg flex items-center gap-2">
        <span className="text-muted">Capacity</span>
        <b className="text-accent">{fmtUsers(maxUsers)} users</b>
        {bottleneck && (
          <>
            <span className="text-line">•</span>
            <span className="text-muted">limited by</span>
            <b style={{ color: '#ff7a7a' }}>{bottleneck}</b>
          </>
        )}
      </div>
    </div>
  )
}
