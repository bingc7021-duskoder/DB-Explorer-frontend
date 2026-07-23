import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Key, Link2, Hash, Sparkles } from 'lucide-react';
import { TableNodeData } from './flowUtils';

export const TableNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as TableNodeData;
  const { table, isSelected, isSearchMatch, isHighlighted, isDimmed, searchTerm, onTableSelect } = nodeData;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTableSelect) {
      onTableSelect(table);
    }
  };

  const cleanSearch = (searchTerm || '').trim().toLowerCase();

  return (
    <div
      onClick={handleClick}
      className={`min-w-[280px] max-w-[320px] rounded-2xl border transition-[border-color,background-color,box-shadow,opacity] duration-200 cursor-pointer shadow-2xl backdrop-blur-xl ${
        isSearchMatch
          ? 'bg-slate-900/95 border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/30 scale-[1.03] z-30'
          : isSelected
          ? 'bg-slate-900/95 border-sky-400 ring-4 ring-sky-500/30 shadow-sky-500/20 scale-[1.02] z-30'
          : isHighlighted
          ? 'bg-slate-900/90 border-brand-500 ring-2 ring-brand-500/30 z-20'
          : isDimmed
          ? 'bg-slate-950/40 border-slate-900 opacity-25 filter blur-[0.4px] scale-[0.98]'
          : 'bg-slate-900/85 border-slate-800 hover:border-slate-700 hover:shadow-slate-900/80'
      }`}
    >
      {/* Target Connection Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-3 !h-3 !border-2 !border-slate-900 transition-colors ${
          isSearchMatch ? '!bg-emerald-400' : isSelected ? '!bg-sky-400' : '!bg-brand-500'
        }`}
      />

      {/* Table Header Bar */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-3 rounded-t-2xl transition-colors duration-200 ${
          isSearchMatch
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : isSelected
            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
            : 'bg-slate-950/70 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
              isSearchMatch
                ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300 animate-pulse'
                : isSelected
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-brand-500/10 border-brand-500/30 text-brand-400'
            }`}
          >
            <Database className="w-4 h-4" />
          </div>
          <h3
            className={`font-bold text-xs tracking-tight truncate ${
              isSearchMatch ? 'text-emerald-300' : 'text-white'
            }`}
            title={table.tableName}
          >
            {table.tableName}
          </h3>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-mono shrink-0 transition-colors ${
            isSearchMatch
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          {table.columns.length} cols
        </span>
      </div>

      {/* Column List Body */}
      <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto custom-scrollbar">
        {table.columns.map((col) => {
          const isPK = table.primaryKeys.includes(col.columnName);
          const isFK = table.foreignKeys.some((fk) => fk.columnName === col.columnName);
          const isColMatch = cleanSearch ? col.columnName.toLowerCase().includes(cleanSearch) : false;

          return (
            <div
              key={col.columnName}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors duration-200 ${
                isColMatch
                  ? 'bg-emerald-500/25 border border-emerald-500/60 text-emerald-100 ring-2 ring-emerald-500/40 font-bold shadow-md shadow-emerald-500/20'
                  : isPK
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                  : isFK
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-200'
                  : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
              }`}
            >
              {/* Left Column Name & Key/Match Badges */}
              <div className="flex items-center gap-2 min-w-0 truncate">
                {isColMatch ? (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-spin" />
                ) : isPK ? (
                  <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : isFK ? (
                  <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0 opacity-40" />
                )}

                <span
                  className={`truncate font-semibold ${isColMatch ? 'text-emerald-200' : ''}`}
                  title={col.columnName}
                >
                  {col.columnName}
                </span>

                {isColMatch && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400 uppercase tracking-wider">
                    MATCH
                  </span>
                )}
                {isPK && !isColMatch && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PK
                  </span>
                )}
                {isFK && !isColMatch && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    FK
                  </span>
                )}
              </div>

              {/* Data Type Badge */}
              <span
                className={`text-[10px] uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded border transition-colors ${
                  isColMatch
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800'
                }`}
              >
                {col.dataType.replace(/character varying/i, 'varchar')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Source Connection Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-3 !h-3 !border-2 !border-slate-900 transition-colors ${
          isSearchMatch ? '!bg-emerald-400' : isSelected ? '!bg-sky-400' : '!bg-brand-500'
        }`}
      />
    </div>
  );
});

TableNode.displayName = 'TableNode';
