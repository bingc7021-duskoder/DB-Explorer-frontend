import React, { useState, useMemo } from 'react';
import { Table, Clock, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

interface DynamicDataTableProps {
  data: Record<string, any>[];
  rowCount?: number;
  executionTimeMs?: number;
  title?: string;
}

export const DynamicDataTable: React.FC<DynamicDataTableProps> = ({
  data,
  rowCount,
  executionTimeMs,
  title = 'Structured Output Data',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>('');
  const pageSize = 8;

  // Extract all unique column headers dynamically from all objects in data array
  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    const keysSet = new Set<string>();
    data.forEach((item) => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [data]);

  // Format header strings dynamically: "customerId" -> "Customer ID", "risk_score" -> "Risk Score"
  const formatHeaderTitle = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\bId\b/gi, 'ID')
      .trim();
  };

  // Filter rows based on search filter input
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;
    const query = filterText.toLowerCase();
    return data.filter((row) =>
      headers.some((header) => {
        const val = row[header];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [data, headers, filterText]);

  // Pagination Math
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Helper to format cell value
  const renderCellValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-600 font-mono text-[10px] italic">NULL</span>;
    }

    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            val
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }

    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return (
          <div className="flex flex-wrap gap-1">
            {val.map((item, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700"
              >
                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              </span>
            ))}
          </div>
        );
      }
      return (
        <span className="text-slate-400 font-mono text-[10px] truncate block max-w-xs" title={JSON.stringify(val)}>
          {JSON.stringify(val)}
        </span>
      );
    }

    const strVal = String(val);

    // Apply color badge formatting for status/risk keywords
    if (/high risk|danger|failed|error|rejected/i.test(strVal)) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
          {strVal}
        </span>
      );
    }
    if (/medium risk|warning|pending|review/i.test(strVal)) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
          {strVal}
        </span>
      );
    }
    if (/low risk|active|success|completed|passed/i.test(strVal)) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
          {strVal}
        </span>
      );
    }

    return <span className="text-slate-200 text-xs font-mono">{strVal}</span>;
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-center flex flex-col items-center justify-center gap-1.5">
        <FileText className="w-5 h-5 text-slate-500" />
        <span className="text-xs text-slate-400 font-medium">No tabular data available for this query</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/90 shadow-xl my-2">
      {/* Header Toolbar */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono font-semibold">
            {rowCount || data.length} {data.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Table Search Filter */}
          {data.length > 3 && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter table..."
                className="pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors w-32 sm:w-40 font-mono"
              />
            </div>
          )}

          {executionTimeMs !== undefined && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
              <Clock className="w-3 h-3 text-brand-400" />
              <span>{executionTimeMs}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto max-h-72 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/95 sticky top-0 z-10 text-[11px] font-semibold text-slate-300 border-b border-slate-800">
            <tr>
              {headers.map((h) => (
                <th key={h} className="py-2.5 px-3.5 whitespace-nowrap bg-slate-900 border-b border-slate-800">
                  {formatHeaderTitle(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-6 text-center text-xs text-slate-500 italic">
                  No matching records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-850/60 transition-colors">
                  {headers.map((h, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderCellValue(row[h])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-3.5 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-0.5 text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
