import React, { useState, useMemo } from 'react';
import { ChatMessage } from '../../types';
import { DynamicDataTable } from './DynamicDataTable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Database,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
  onRetry?: (queryText: string) => void;
  lastUserQuery?: string;
}

export const Message: React.FC<MessageProps> = ({ message, onRetry, lastUserQuery }) => {
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const isUser = message.sender === 'user';

  const handleCopySql = () => {
    if (!message.sql) return;
    navigator.clipboard.writeText(message.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Helper to dynamically extract tabular data array from message object or parsed JSON string
  const tabularData = useMemo<Record<string, any>[] | null>(() => {
    // 1. Direct message.data array
    if (Array.isArray(message.data) && message.data.length > 0) {
      return message.data;
    }

    // 2. Try parsing messageText if it is a JSON payload
    if (message.messageText && typeof message.messageText === 'string') {
      const trimmed = message.messageText.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;

          // Check common keys in response object
          const possibleArray =
            parsed.data || parsed.records || parsed.results || parsed.rows || parsed.items || parsed.customers;
          if (Array.isArray(possibleArray) && possibleArray.length > 0) {
            return possibleArray;
          }
        } catch (e) {
          // Not valid JSON string, ignore
        }
      }
    }

    return null;
  }, [message.data, message.messageText]);

  // Extract concise Executive Summary string for Section A
  const summaryText = useMemo<string>(() => {
    if (message.summary && message.summary.trim()) {
      return message.summary.trim();
    }

    // If answer/messageText exists and isn't raw JSON, use it as summary
    if (message.answer && message.answer.trim()) {
      return message.answer.trim();
    }

    if (message.messageText && !message.messageText.trim().startsWith('{')) {
      return message.messageText.trim();
    }

    return message.title ? `${message.title} query output processed successfully.` : 'Query execution completed.';
  }, [message.summary, message.answer, message.messageText, message.title]);

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User Message Bubble */}
        {isUser ? (
          <div className="p-3.5 rounded-2xl bg-brand-600 text-white shadow-lg text-xs leading-relaxed font-medium">
            {message.messageText}
          </div>
        ) : (
          /* Assistant Response Container Card */
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs leading-relaxed space-y-3.5 bg-slate-900/90 shadow-xl">
            {/* Title Header */}
            {message.title && (
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <span>{message.title}</span>
                {message.type && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    {message.type}
                  </span>
                )}
              </h3>
            )}

            {/* SECTION A: AI Summary Card */}
            {summaryText && (
              <div className="p-3.5 bg-brand-500/10 border-l-4 border-brand-400 rounded-r-2xl text-slate-200 text-xs leading-relaxed shadow-sm">
                <div className="flex items-center gap-1.5 text-brand-300 font-bold text-[11px] mb-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>AI Executive Summary</span>
                </div>
                <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-snug">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Highlights Badges */}
            {message.highlights && message.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {message.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 font-mono text-[10px] font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* Generated SQL Collapsible Block */}
            {message.sql && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                <button
                  onClick={() => setShowSql(!showSql)}
                  className="w-full px-3.5 py-2 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors border-b border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-brand-400" />
                    <span>Generated SQL Query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySql();
                      }}
                      className="text-slate-400 hover:text-brand-400 transition-colors p-1"
                      title="Copy SQL"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {showSql && (
                  <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto bg-slate-950 border-t border-slate-800/40">
                    <code>{message.sql}</code>
                  </pre>
                )}
              </div>
            )}

            {/* SECTION B: Structured Data Table */}
            {tabularData && tabularData.length > 0 ? (
              <DynamicDataTable
                data={tabularData}
                rowCount={message.rowCount}
                executionTimeMs={message.executionTimeMs}
              />
            ) : message.data && message.data.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-center flex items-center justify-center gap-2 text-slate-400 text-xs">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>No matching data records found in database</span>
              </div>
            ) : null}

            {/* ERROR STATE with Retry Action */}
            {(message.error || message.type === 'error') && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">{message.error || message.messageText || 'API Error occurred'}</span>
                </div>
                {onRetry && lastUserQuery && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onRetry(lastUserQuery)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry Query</span>
                    </button>
                  </div>
                )}
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
