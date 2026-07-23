import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Database, LogOut, User as UserIcon, CheckCircle2, X } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [imageError, setImageError] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 300); // 300ms smooth crossfade duration
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 300);
  };

  const rawName = user.name || 'User';

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-500 shadow-md shadow-brand-500/10">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">ERP Schema Explorer</h1>
            <span className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-[10px] font-semibold text-brand-400">
              v1.0 Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400">AI Database Architecture</p>
        </div>
      </div>

      {/* Top-Right Area: Temporarily displays Success Notification, then crossfades into User Profile */}
      <div className="flex items-center min-h-[44px]">
        {showNotification ? (
          /* TEMPORARY SIMPLE LOGIN SUCCESS NOTIFICATION (TOP-RIGHT CORNER) */
          <div
            className={`flex items-center gap-2.5 bg-slate-950/90 border border-emerald-500/40 p-2 px-3.5 rounded-2xl shadow-lg shadow-emerald-950/40 relative overflow-hidden backdrop-blur-md transition-all duration-300 ${
              isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-fade-in'
            }`}
          >
            {/* Success Icon */}
            <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 shrink-0 animate-checkmark-pop">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Simple Text: Welcome $name, logged in successfully */}
            <p className="text-xs font-semibold text-white tracking-tight whitespace-nowrap pr-1">
              Welcome <span className="text-emerald-400 font-bold">{rawName}</span>, logged in successfully
            </p>

            {/* Dismiss Button */}
            <button
              onClick={dismissNotification}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors ml-0.5 shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress Bar Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/80 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full animate-toast-progress" />
            </div>
          </div>
        ) : (
          /* REGULAR LOGGED-IN USER PROFILE SECTION (CROSSFADES IN) */
          <div className="flex items-center gap-3 bg-slate-950/70 p-1.5 px-3 rounded-2xl border border-slate-800/80 shadow-md transition-all duration-300 animate-fade-in">
            {/* Circular Profile Image / Default Avatar */}
            {user.profilePictureUrl && !imageError ? (
              <img
                src={user.profilePictureUrl}
                alt={user.name || 'User Profile'}
                onError={() => setImageError(true)}
                className="w-9 h-9 rounded-full border-2 border-brand-500/50 object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white border-2 border-brand-400 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}

            {/* User Info (Name & Email) */}
            <div className="hidden sm:block text-left max-w-[180px] md:max-w-[240px]">
              <p className="text-xs font-semibold text-white leading-tight truncate" title={user.name}>
                {user.name || 'Authenticated User'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5" title={user.email}>
                {user.email || 'No email'}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Log out of ERP Schema Explorer"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
