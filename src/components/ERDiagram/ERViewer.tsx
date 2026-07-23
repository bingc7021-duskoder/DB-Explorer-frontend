import React, { useState, useEffect } from 'react';
import { SchemaMetadata, TableMetadata } from '../../types';
import { ReactFlowERDiagram } from './ReactFlowERDiagram';
import { TableDetailsModal } from './TableDetailsModal';
import { Search, RefreshCw, Database, ChevronRight, X } from 'lucide-react';

interface ERViewerProps {
  schema: SchemaMetadata | null;
  mermaidSyntax?: string;
  isLoading: boolean;
  error: string | null;
  onRefreshSchema: () => void;
}

export const ERViewer: React.FC<ERViewerProps> = ({
  schema,
  isLoading,
  error,
  onRefreshSchema,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Keyboard shortcut listener: Exit full screen on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const filteredTables =
    schema?.tables.filter((t) =>
      t.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Diagram Table Click: Only highlights table & relationships without opening details drawer
  const handleDiagramTableClick = (_table: TableMetadata) => {
    // Highlighting & focusing is handled internally by ReactFlowERDiagram via selectedTableName
  };

  // Focus Mode Full Screen Toggle with Automatic UI Clean-up
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
      if (selectedTable) {
        setSelectedTable(null);
      }
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden font-sans transition-all duration-300 ease-in-out animate-fade-in'
          : 'w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative font-sans transition-all duration-300 ease-in-out'
      }
    >
      {/* Clean Top Control Toolbar (Essential Controls Only) */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
        {/* Left Toolbar Search Input */}
        <div className="flex items-center gap-3">
          <div className="relative w-56 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table or column..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Toolbar Control: Refresh Schema */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshSchema}
            disabled={isLoading}
            className="p-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            title="Reload schema metadata from backend API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Area with Permanent Navigation Dock & Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Permanent Navigation Dock Strip on Left Edge */}
        <div className="w-12 sm:w-14 h-full border-r border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col items-center py-3.5 shrink-0 z-20 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2.5 rounded-2xl transition-all flex flex-col items-center gap-1 group relative ${
              sidebarOpen
                ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400 shadow-lg shadow-brand-500/10'
                : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700'
            }`}
            title={sidebarOpen ? 'Close Tables Sidebar' : `Open Database Tables (${schema?.tables.length || 0})`}
          >
            <Database className="w-5 h-5 text-brand-400 transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-slate-300">Tables</span>

            {/* Table Count Badge */}
            {schema?.tables && schema.tables.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-brand-600 text-white font-mono text-[9px] font-bold shadow-md border border-brand-400">
                {schema.tables.length}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Left Tables Panel */}
        <div
          className={`h-full border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col shrink-0 z-10 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'
          }`}
        >
          <div className="p-3.5 px-4 border-b border-slate-800/80 text-xs font-bold text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              <span>Database Tables</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                {filteredTables.length}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredTables.map((t) => (
              <button
                key={t.tableName}
                onClick={() => setSelectedTable(t)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-all text-xs font-mono text-slate-300 flex items-center justify-between group border border-transparent hover:border-slate-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <Database className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="truncate">{t.tableName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {t.columns.length} c
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* React Flow Interactive ER Diagram Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
              <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-200">Loading Interactive React Flow ER Diagram...</p>
              <p className="text-xs text-slate-400 mt-1">Fetching metadata from backend API...</p>
            </div>
          ) : error ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl max-w-md">
                <p className="text-sm font-bold text-rose-400 mb-2">Schema Fetch Failed</p>
                <p className="text-xs text-slate-300 mb-4">{error}</p>
                <button
                  onClick={onRefreshSchema}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <ReactFlowERDiagram
              schema={schema}
              onTableClick={handleDiagramTableClick}
              searchTerm={searchTerm}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          )}
        </div>
      </div>

      {/* Selected Table Details Drawer (Only opened from Tables Sidebar) */}
      <TableDetailsModal table={selectedTable} onClose={() => setSelectedTable(null)} />
    </div>
  );
};
