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
import { getDef, isContainerType } from '../catalog'
import { ComponentNode } from './ComponentNode'
import { GroupNode } from './GroupNode'
import { EditorBar } from './EditorBar'
import type { ComponentType, DesignNode } from '../types'

const nodeTypes: NodeTypes = { component: ComponentNode, group: GroupNode }

export function Canvas() {
  const wrapper = useRef<HTMLDivElement>(null)
  const rf = useReactFlow<DesignNode>()
  const { screenToFlowPosition, getIntersectingNodes } = rf

  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const addNode = useStore((s) => s.addNode)
  const reparentNode = useStore((s) => s.reparentNode)
  const selectMany = useStore((s) => s.selectMany)
  const beginHistory = useStore((s) => s.beginHistory)

  const snapToGrid = useStore((s) => s.snapToGrid)
  const gridSize = useStore((s) => s.gridSize)
  const selectionMode = useStore((s) => s.selectionMode)
  const isSelect = selectionMode === 'select'

  const area = (n: DesignNode) => (n.measured?.width ?? (n.width as number) ?? 1) * (n.measured?.height ?? (n.height as number) ?? 1)

  // Smallest (most specific) container whose bounds intersect the given rect/node.
  const containerAt = useCallback(
    (rect: { x: number; y: number; width: number; height: number } | DesignNode, excludeId?: string) => {
      const hits = getIntersectingNodes(rect as any)
        .filter((n) => isContainerType((n.data as any).type) && n.id !== excludeId)
        .sort((a, b) => area(a as DesignNode) - area(b as DesignNode))
      return hits[0] as DesignNode | undefined
    },
    [getIntersectingNodes],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/sysdesign') as ComponentType
      if (!type || getDef(type).type === 'unknown') return
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const pos = { x: flow.x - 84, y: flow.y - 24 }
      const target = containerAt({ x: pos.x, y: pos.y, width: 168, height: 76 })
      addNode(type, pos)
      // addNode selects the new node; attach it to a container it was dropped onto.
      if (target) {
        const newId = useStore.getState().selectedId
        if (newId && newId !== target.id) reparentNode(newId, target.id)
      }
    },
    [screenToFlowPosition, addNode, reparentNode, containerAt],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onSelectionChange = useCallback(
    (p: OnSelectionChangeParams) => selectMany(p.nodes.map((n) => n.id)),
    [selectMany],
  )

  // Re-evaluate container membership when a node is dropped after dragging.
  const onNodeDragStop = useCallback(
    (_e: MouseEvent | TouchEvent, node: DesignNode) => {
      const target = containerAt(node, node.id)
      reparentNode(node.id, target?.id ?? null)
    },
    [containerAt, reparentNode],
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
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStart={beginHistory}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
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
          nodeColor={(n) => getDef((n.data as any).type as ComponentType).accent}
          maskColor="rgba(15,19,32,.7)"
          style={{ background: '#161b2d', border: '1px solid #2a3350' }}
        />
      </ReactFlow>
      <EditorBar />
    </div>
  )
}
