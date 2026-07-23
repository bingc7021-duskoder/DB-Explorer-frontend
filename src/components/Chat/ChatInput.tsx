import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-900/90 border-t border-slate-800">
      <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl focus-within:border-brand-500 transition-all p-2 shadow-xl">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI a question about schema, tables, or database records..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none max-h-24 min-h-[36px]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-lg shadow-brand-500/20 active:scale-95"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin text-brand-200" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};
