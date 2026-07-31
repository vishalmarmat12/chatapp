import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageSquare, UserPlus, Bell, Settings, LogOut, Copy, Check, Moon, Sun, UserCheck, Edit, Lock } from 'lucide-react';

export default function SidebarHeader({
  pendingRequestsCount,
  onOpenSearchUsers,
  onOpenRequests,
  onOpenNotifications,
  onOpenEditProfile,
  onOpenSettings,
  onLockVault
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e) => {
    e.stopPropagation();
    if (user?.unique_id) {
      navigator.clipboard.writeText(user.unique_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0">
      {/* Brand & Action Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base font-heading tracking-tight leading-none">ByteChat</h2>
            <span className="text-[10px] text-cyan-400 font-medium">Private Messenger</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearchUsers}
            className="p-2 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition"
            title="Find / Add Friends"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenRequests}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Pending Requests"
          >
            <UserCheck className="w-4 h-4" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenNotifications}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={onLockVault}
            className="p-2 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition"
            title="Lock Vault (Calculator Disguise)"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logged User Info Badge */}
      {user && (
        <div
          onClick={onOpenEditProfile}
          className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between transition cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.fullname} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white text-sm">
                  {user.fullname?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 bg-emerald-500"></div>
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-white text-xs truncate group-hover:text-cyan-400 transition">{user.fullname}</h4>
              <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
            </div>
          </div>

          <button
            onClick={handleCopyId}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition shrink-0"
            title="Copy Unique User ID"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : user.unique_id}</span>
          </button>
        </div>
      )}
    </div>
  );
}
