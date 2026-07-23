import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, User, Database, ChevronDown, ChevronUp, Copy, Check, Table, Clock, AlertTriangle } from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const [showSql, setShowSql] = useState<boolean>(false);
  const [showData, setShowData] = useState<boolean>(true);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const isUser = message.sender === 'user';

  const handleCopySql = () => {
    if (!message.sql) return;
    navigator.clipboard.writeText(message.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User Message Bubble */}
        {isUser ? (
          <div className="p-3.5 rounded-2xl bg-brand-600 text-white shadow-lg text-xs leading-relaxed font-medium">
            {message.messageText}
          </div>
        ) : (
          /* Assistant Response Card */
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs leading-relaxed space-y-3 bg-slate-900/90 shadow-xl">
            {/* Title / Summary Header */}
            {message.title && (
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                <span>{message.title}</span>
              </h3>
            )}

            {/* Answer / Content */}
            <div className="prose prose-invert prose-xs max-w-none text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.messageText || message.answer || message.summary || ''}
              </ReactMarkdown>
            </div>

            {/* Highlights Chips */}
            {message.highlights && message.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {message.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 font-mono text-[10px]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* SQL Execution Block */}
            {message.sql && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                <button
                  onClick={() => setShowSql(!showSql)}
                  className="w-full px-3 py-2 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors border-b border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-brand-400" />
                    <span>Generated PostgreSQL Query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySql();
                      }}
                      className="text-slate-400 hover:text-brand-400 transition-colors p-1"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {showSql && (
                  <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto bg-slate-950">
                    <code>{message.sql}</code>
                  </pre>
                )}
              </div>
            )}

            {/* Data Results Table Preview */}
            {message.data && message.data.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                <div className="px-3 py-2 bg-slate-950 flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Query Output Data ({message.rowCount || message.data.length} rows)</span>
                  </div>
                  {message.executionTimeMs && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{message.executionTimeMs}ms</span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        {Object.keys(message.data[0]).map((key) => (
                          <th key={key} className="py-2 px-3 font-medium whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {message.data.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx} className="py-2 px-3 whitespace-nowrap">
                              {val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Message */}
            {message.error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{message.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-md">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
