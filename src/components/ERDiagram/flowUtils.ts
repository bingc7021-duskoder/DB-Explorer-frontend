import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { SchemaMetadata, TableMetadata } from '../../types';

export interface TableNodeData {
  table: TableMetadata;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isSearchMatch?: boolean;
  searchTerm?: string;
  onTableSelect?: (table: TableMetadata) => void;
  [key: string]: unknown;
}

export function buildFlowNodesAndEdges(
  schema: SchemaMetadata,
  selectedTableName: string | null,
  searchTerm: string = ''
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  if (!schema || !schema.tables || schema.tables.length === 0) {
    return { nodes: [], edges: [] };
  }

  const cleanSearch = searchTerm.trim().toLowerCase();

  // Find all tables that match search term (by table name or column name)
  const searchMatchedTablesSet = new Set<string>();
  if (cleanSearch) {
    for (const table of schema.tables) {
      const matchesTable = table.tableName.toLowerCase().includes(cleanSearch);
      const matchesColumn = table.columns.some((c) =>
        c.columnName.toLowerCase().includes(cleanSearch)
      );
      if (matchesTable || matchesColumn) {
        searchMatchedTablesSet.add(table.tableName);
      }
    }
  }

  // Determine active focus tables (Selected table OR Search matched tables + their direct connections)
  const activeFocusTablesSet = new Set<string>();

  if (selectedTableName) {
    activeFocusTablesSet.add(selectedTableName);
    for (const table of schema.tables) {
      if (table.tableName === selectedTableName) {
        for (const fk of table.foreignKeys) {
          activeFocusTablesSet.add(fk.referencedTable);
        }
      }
      for (const fk of table.foreignKeys) {
        if (fk.referencedTable === selectedTableName) {
          activeFocusTablesSet.add(table.tableName);
        }
      }
    }
  } else if (cleanSearch && searchMatchedTablesSet.size > 0) {
    for (const matchedTable of searchMatchedTablesSet) {
      activeFocusTablesSet.add(matchedTable);
      for (const table of schema.tables) {
        if (table.tableName === matchedTable) {
          for (const fk of table.foreignKeys) {
            activeFocusTablesSet.add(fk.referencedTable);
          }
        }
        for (const fk of table.foreignKeys) {
          if (fk.referencedTable === matchedTable) {
            activeFocusTablesSet.add(table.tableName);
          }
        }
      }
    }
  }

  // Create Dagre Graph for Auto Layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 140 });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 290;

  // Build Node definitions
  const rawNodes: Node<TableNodeData>[] = schema.tables.map((table) => {
    const isSelected = selectedTableName === table.tableName;
    const isSearchMatch = searchMatchedTablesSet.has(table.tableName);
    const isConnected = activeFocusTablesSet.has(table.tableName);
    const isHighlighted = isSelected || isSearchMatch || isConnected;
    const isDimmed = activeFocusTablesSet.size > 0 && !isHighlighted;

    // Estimate node height based on column count
    const nodeHeight = Math.max(120, 52 + table.columns.length * 30);
    g.setNode(table.tableName, { width: nodeWidth, height: nodeHeight });

    return {
      id: table.tableName,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: {
        table,
        isSelected,
        isSearchMatch,
        isHighlighted,
        isDimmed,
        searchTerm: cleanSearch,
      },
    };
  });

  // Build Edge definitions with relationship highlighting (no position CSS transitions to avoid drag latency)
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  for (const table of schema.tables) {
    for (const fk of table.foreignKeys) {
      const targetTableExists = schema.tables.some((t) => t.tableName === fk.referencedTable);
      if (targetTableExists && table.tableName !== fk.referencedTable) {
        const edgeId = `edge-${fk.referencedTable}-${table.tableName}-${fk.columnName}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);

          g.setEdge(fk.referencedTable, table.tableName);

          // Determine edge highlight status
          const isEdgeHighlighted =
            (selectedTableName !== null &&
              (table.tableName === selectedTableName || fk.referencedTable === selectedTableName)) ||
            (searchMatchedTablesSet.size > 0 &&
              (searchMatchedTablesSet.has(table.tableName) ||
                searchMatchedTablesSet.has(fk.referencedTable)));

          const isEdgeDimmed =
            (selectedTableName !== null || searchMatchedTablesSet.size > 0) && !isEdgeHighlighted;

          const edgeColor = isEdgeHighlighted
            ? searchMatchedTablesSet.size > 0
              ? '#10b981' // Bright Emerald Green for Search Match
              : '#38bdf8' // Bright Sky Blue for Selection
            : isEdgeDimmed
            ? '#1e293b'
            : '#6366f1';

          edges.push({
            id: edgeId,
            source: fk.referencedTable,
            target: table.tableName,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep',
            animated: isEdgeHighlighted,
            style: {
              stroke: edgeColor,
              strokeWidth: isEdgeHighlighted ? 3.5 : isEdgeDimmed ? 1 : 2,
              opacity: isEdgeDimmed ? 0.15 : 0.9,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
              width: isEdgeHighlighted ? 18 : 14,
              height: isEdgeHighlighted ? 18 : 14,
            },
            label: fk.columnName,
            labelStyle: {
              fill: isEdgeHighlighted ? edgeColor : isEdgeDimmed ? '#475569' : '#94a3b8',
              fontSize: isEdgeHighlighted ? 11 : 10,
              fontWeight: isEdgeHighlighted ? 700 : 500,
            },
            labelBgStyle: {
              fill: '#0f172a',
              fillOpacity: isEdgeDimmed ? 0.4 : 0.9,
              rx: 4,
              ry: 4,
            },
          });
        }
      }
    }
  }

  // Calculate Dagre layout positions
  dagre.layout(g);

  // Apply positions to nodes
  const nodes = rawNodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - (g.node(node.id).height || 150) / 2,
      },
    };
  });

  return { nodes, edges };
}
