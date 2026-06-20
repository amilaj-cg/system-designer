import { useCallback, useRef } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type NodeTypes,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { useStore } from '../store'
import { CATALOG } from '../catalog'
import { ComponentNode } from './ComponentNode'
import { EditorBar } from './EditorBar'
import type { ComponentType } from '../types'

const nodeTypes: NodeTypes = { component: ComponentNode }

export function Canvas() {
  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const addNode = useStore((s) => s.addNode)
  const selectMany = useStore((s) => s.selectMany)
  const beginHistory = useStore((s) => s.beginHistory)

  const snapToGrid = useStore((s) => s.snapToGrid)
  const gridSize = useStore((s) => s.gridSize)
  const selectionMode = useStore((s) => s.selectionMode)
  const isSelect = selectionMode === 'select'

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/sysdesign') as ComponentType
      if (!type || !CATALOG[type]) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(type, { x: pos.x - 84, y: pos.y - 24 })
    },
    [screenToFlowPosition, addNode],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onSelectionChange = useCallback(
    (p: OnSelectionChangeParams) => selectMany(p.nodes.map((n) => n.id)),
    [selectMany],
  )

  return (
    <div className="flex-1 h-full select-none" ref={wrapper} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={beginHistory}
        onSelectionDragStart={beginHistory}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        // In "select" mode, drag draws a selection box; pan with middle/right mouse.
        // In "pan" mode, drag pans; hold Shift to box-select.
        selectionOnDrag={isSelect}
        panOnDrag={isSelect ? [1, 2] : true}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionKeyCode="Shift"
        deleteKeyCode={null}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color="#2a3350" />
        <Controls className="!shadow-none" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => CATALOG[(n.data as any).type as ComponentType]?.accent ?? '#6ea8fe'}
          maskColor="rgba(15,19,32,.7)"
          style={{ background: '#161b2d', border: '1px solid #2a3350' }}
        />
      </ReactFlow>
      <EditorBar />
    </div>
  )
}
