import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SchemaMetadata, TableMetadata } from '../../types';
import { TableNode } from './TableNode';
import { buildFlowNodesAndEdges, TableNodeData } from './flowUtils';
import { Maximize2, Minimize2, Plus, Minus, Maximize, EyeOff, Layers } from 'lucide-react';

interface ReactFlowERDiagramProps {
  schema: SchemaMetadata | null;
  onTableClick: (table: TableMetadata) => void;
  searchTerm?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const nodeTypes = {
  tableNode: TableNode,
};

interface DiagramControlsProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  selectedTableName: string | null;
  onClearSelection: () => void;
}

function DiagramControls({
  isFullscreen,
  onToggleFullscreen,
  selectedTableName,
  onClearSelection,
}: DiagramControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 bg-slate-900/95 border border-slate-800 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl">
      {/* Zoom In */}
      <button
        onClick={() => zoomIn({ duration: 250 })}
        className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-slate-700"
        title="Zoom In (+)"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={() => zoomOut({ duration: 250 })}
        className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-slate-700"
        title="Zoom Out (-)"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-800 mx-0.5" />

      {/* Fit to View */}
      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-slate-700 text-xs flex items-center gap-1.5"
        title="Fit to View (Fit all tables within screen)"
      >
        <Maximize2 className="w-4 h-4 text-brand-400" />
        <span className="font-semibold hidden sm:inline text-slate-200">Fit View</span>
      </button>

      {onToggleFullscreen && (
        <>
          <div className="w-px h-5 bg-slate-800 mx-0.5" />

          {/* Single Full Screen / Exit Fullscreen Control */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-slate-700 text-xs flex items-center gap-1.5"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span className="font-semibold hidden sm:inline text-amber-300">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-sky-400" />
                <span className="font-semibold hidden sm:inline text-slate-200">Full Screen</span>
              </>
            )}
          </button>
        </>
      )}

      {selectedTableName && (
        <>
          <div className="w-px h-5 bg-slate-800 mx-0.5" />
          <button
            onClick={onClearSelection}
            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 transition-all text-xs flex items-center gap-1.5"
            title="Clear active highlights"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">Reset Highlights</span>
          </button>
        </>
      )}
    </div>
  );
}

const FlowCanvas: React.FC<ReactFlowERDiagramProps> = ({
  schema,
  onTableClick,
  searchTerm = '',
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Container Resize Observer: Updates React Flow container measurement on divider drag / panel resize
  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;

    const observer = new ResizeObserver(() => {
      animationFrameId = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });

    observer.observe(containerRef.current);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  // Generate initial nodes and edges from schema metadata
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!schema) return { initialNodes: [], initialEdges: [] };
    const { nodes, edges } = buildFlowNodesAndEdges(schema, selectedTableName, searchTerm);
    return { initialNodes: nodes, initialEdges: edges };
  }, [schema, selectedTableName, searchTerm]);

  const [nodes, setNodes] = useState<Node<TableNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Update nodes and edges when schema, selected table, or search term changes
  useEffect(() => {
    if (schema) {
      const { nodes: updatedNodes, edges: updatedEdges } = buildFlowNodesAndEdges(
        schema,
        selectedTableName,
        searchTerm
      );
      // Preserve positions if nodes were dragged
      setNodes((prevNodes) => {
        const prevPosMap = new Map(prevNodes.map((n) => [n.id, n.position]));
        return updatedNodes.map((node) => ({
          ...node,
          position: prevPosMap.get(node.id) || node.position,
          data: {
            ...node.data,
            onTableSelect: (table: TableMetadata) => {
              setSelectedTableName(table.tableName);
              onTableClick(table);
            },
          },
        }));
      });
      setEdges(updatedEdges);
    }
  }, [schema, selectedTableName, searchTerm, onTableClick]);

  // Handle Node Changes (Drag, Selection)
  const handleNodesChange = useCallback((changes: NodeChange<Node<TableNodeData>>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Handle Edge Changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Handle Node Click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const tableName = node.id;
      setSelectedTableName(tableName);
      const tableObj = schema?.tables.find((t) => t.tableName === tableName);
      if (tableObj) {
        onTableClick(tableObj);
      }
    },
    [schema, onTableClick]
  );

  // Handle Background Click
  const handlePaneClick = useCallback(() => {
    setSelectedTableName(null);
  }, []);

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950 text-slate-400">
        <Layers className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <p className="text-sm font-bold text-slate-300">No ER Diagram Nodes Available</p>
        <p className="text-xs text-slate-500 mt-1">Schema metadata is empty or failed to load.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#1e293b" />

        {/* Essential Diagram Controls Only (+, -, Fit View, Single Full Screen Toggle) */}
        <DiagramControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          selectedTableName={selectedTableName}
          onClearSelection={() => setSelectedTableName(null)}
        />
      </ReactFlow>
    </div>
  );
};

export const ReactFlowERDiagram: React.FC<ReactFlowERDiagramProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
