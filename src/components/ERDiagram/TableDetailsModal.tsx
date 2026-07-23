import React, { useState, useEffect } from 'react';
import { TableMetadata } from '../../types';
import { X, Key, Link2, Database, Copy, Check, Hash, Calendar, Type, Code2 } from 'lucide-react';

interface TableDetailsModalProps {
  table: TableMetadata | null;
  onClose: () => void;
}

export const TableDetailsModal: React.FC<TableDetailsModalProps> = ({ table, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && table) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [table, onClose]);

  if (!table) return null;

  const generateSelectSql = () => {
    const cols = table.columns.map((c) => c.columnName).join(',\n  ');
    return `SELECT\n  ${cols}\nFROM ${table.tableName}\nLIMIT 100;`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSelectSql());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (dataType: string) => {
    const dt = dataType.toLowerCase();
    if (dt.includes('int') || dt.includes('numeric') || dt.includes('decimal'))
      return <Hash className="w-3.5 h-3.5 text-blue-400" />;
    if (dt.includes('date') || dt.includes('time'))
      return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
    return <Type className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex justify-start bg-slate-950/70 backdrop-blur-md animate-fade-in pointer-events-auto"
    >
      <div className="w-full max-w-lg bg-slate-900/95 border-r border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-hidden backdrop-blur-xl animate-slide-in-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{table.tableName}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {table.columns.length} Columns · {table.primaryKeys.length} PK · {table.foreignKeys.length} FK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Close Inspector (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Columns & Data Types Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Columns & Constraints</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                {table.columns.length} Total
              </span>
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Column Name</th>
                    <th className="py-2.5 px-3.5 font-semibold">Data Type</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Constraint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {table.columns.map((col) => {
                    const isPk = table.primaryKeys.includes(col.columnName);
                    const isFk = col.referencedTable != null;

                    return (
                      <tr key={col.columnName} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-200 flex items-center gap-2 font-medium">
                          {getTypeIcon(col.dataType)}
                          <span>{col.columnName}</span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-400 text-[11px]">
                          {col.dataType}
                          {col.maxLength ? `(${col.maxLength})` : ''}
                        </td>
                        <td className="py-2.5 px-3.5 text-right space-x-1">
                          {isPk && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                              <Key className="w-2.5 h-2.5" /> PK
                            </span>
                          )}
                          {isFk && (
                            <span
                              title={`References ${col.referencedTable}.${col.referencedColumn}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-semibold"
                            >
                              <Link2 className="w-2.5 h-2.5" /> FK ({col.referencedTable})
                            </span>
                          )}
                          {!isPk && !isFk && (
                            <span className="text-[10px] text-slate-500">
                              {col.isNullable ? 'NULL' : 'NOT NULL'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relationships Summary Section */}
          {table.foreignKeys.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Foreign Key Relationships</span>
              </h3>
              <div className="space-y-2">
                {table.foreignKeys.map((fk, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300 font-mono"
                  >
                    <span className="text-sky-300">{fk.columnName}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-semibold">
                      {fk.referencedTable}.{fk.referencedColumn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Query Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Generated SELECT Query</span>
              </h3>
              <button
                onClick={handleCopySql}
                className="text-xs flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto custom-scrollbar">
              <code>{generateSelectSql()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
