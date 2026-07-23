import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { CheckCircle2, X } from 'lucide-react';

interface LoginSuccessNotificationProps {
  user: User;
  onClose: () => void;
  durationMs?: number;
}

export const LoginSuccessNotification: React.FC<LoginSuccessNotificationProps> = ({
  user,
  onClose,
  durationMs = 2800,
}) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [handleDismiss, durationMs]);

  const rawName = user.name || 'User';

  return (
    <div className="fixed inset-x-0 top-5 z-[9999] pointer-events-none flex justify-center px-4">
      <div
        className={`pointer-events-auto glass-panel bg-slate-900/95 border border-emerald-500/40 text-white rounded-full py-2 px-4 shadow-xl shadow-emerald-950/50 relative overflow-hidden backdrop-blur-xl flex items-center gap-2.5 max-w-fit ${
          isExiting ? 'animate-toast-slide-out-center' : 'animate-toast-slide-in-center'
        }`}
      >
        {/* Success Icon */}
        <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 shrink-0 animate-checkmark-pop">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Message: Welcome $name, logged in successfully */}
        <p className="text-xs font-semibold text-white tracking-tight whitespace-nowrap">
          Welcome <span className="text-emerald-400 font-bold">{rawName}</span>, logged in successfully
        </p>

        {/* Dismiss Icon */}
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-full transition-colors shrink-0 ml-0.5"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Subtle Bottom Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/80 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full animate-toast-progress" />
        </div>
      </div>
    </div>
  );
};
