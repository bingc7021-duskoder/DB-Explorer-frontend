import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, ChatSession } from '../../types';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { Sparkles, Trash2, Plus, History, MessageSquare, X } from 'lucide-react';

interface ChatWindowProps {
  sessions?: ChatSession[];
  activeSessionId?: string | null;
  activeSessionTitle?: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectSession?: (sessionId: string) => void;
  onCreateNewSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onClearChat?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  sessions = [],
  activeSessionId,
  activeSessionTitle = 'New Chat',
  messages,
  isLoading,
  onSendMessage,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
}) => {
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickQuestions = [
    'What tables exist in the database?',
    'Show relationships for customer table',
    'Which tables contain foreign keys?',
    'List all customer accounts with high risk scores',
  ];

  // Helper to retrieve the last user question prior to an error/assistant message
  const getLastUserQuery = (msgIndex: number): string | undefined => {
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        return messages[i].messageText;
      }
    }
    return undefined;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Clean Minimal Top Header Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
        {/* Left Header Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{activeSessionTitle || 'New Chat'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium shrink-0">
                Active
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">AI Database Assistant</p>
          </div>
        </div>

        {/* Right Header Navigation: Chat History Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold shadow-sm cursor-pointer active:scale-95 ${
              historyOpen
                ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 ring-2 ring-brand-500/20'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={historyOpen ? 'Close Chat History' : 'Open Chat History'}
          >
            <History className="w-4 h-4 text-brand-400" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Main Body with Messages Stream & Right-side Chat History Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Message List Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-brand-400 mb-4 shadow-lg shadow-brand-500/10">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">AI Database Assistant Ready</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-6">
                Ask natural language questions about your PostgreSQL database schema, data relationships, or records.
              </p>

              {/* Quick Prompt Chips */}
              <div className="w-full max-w-sm space-y-2">
                <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Suggested Questions
                </p>
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-brand-500/40 rounded-xl text-left text-xs text-slate-300 transition-all hover:text-white"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <Message
                key={msg.id}
                message={msg}
                onRetry={onSendMessage}
                lastUserQuery={getLastUserQuery(idx)}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs p-3 bg-slate-900/60 rounded-xl border border-slate-800 w-max animate-pulse">
              <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
              <span>Analyzing schema metadata & generating answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat History Panel (Sliding in from RIGHT side of Chat Window) */}
        {historyOpen && (
          <div className="w-64 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col shrink-0 z-20 transition-all duration-300 animate-toast-slide-in-right">
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-400" />
                <span>Chat History</span>
              </span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Single Official "New Chat" Button */}
            <div className="p-3 border-b border-slate-800/60 shrink-0">
              {onCreateNewSession && (
                <button
                  onClick={() => {
                    onCreateNewSession();
                    setHistoryOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              )}
            </div>

            {/* Scrollable Conversations List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous conversations</p>
              ) : (
                sessions.map((s) => {
                  const isActive = s.sessionId === activeSessionId;
                  const isConfirmingDelete = deleteConfirmId === s.sessionId;

                  if (isConfirmingDelete) {
                    return (
                      <div
                        key={s.sessionId}
                        className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs flex items-center justify-between animate-fade-in"
                      >
                        <span className="text-[11px] text-rose-300 font-medium truncate pr-1">Delete chat?</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteSession) onDeleteSession(s.sessionId);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.sessionId}
                      onClick={() => {
                        if (onSelectSession) onSelectSession(s.sessionId);
                        setHistoryOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer border ${
                        isActive
                          ? 'bg-brand-500/15 border-brand-500/40 text-brand-300 shadow-md font-bold'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{s.title || 'New Chat'}</span>
                      </div>

                      {onDeleteSession && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(s.sessionId);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-400 transition-opacity"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};
