import React, { useState } from 'react';
import { ArrowLeft, Search, User, MoreVertical, ShieldAlert, Trash2, VolumeX, Download, Check } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function ChatHeader({
  friend,
  onBack,
  onOpenProfile,
  onOpenSearch,
  onClearChat,
  onExportChat
}) {
  const { onlineStatusMap, typingUsers } = useSocket();
  const [showOptions, setShowOptions] = useState(false);

  const realtimeStatus = onlineStatusMap[friend.id];
  const currentStatus = realtimeStatus?.status || friend.status || 'offline';
  const isOnline = currentStatus === 'online';
  const isTyping = typingUsers[friend.id];

  return (
    <div className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          onClick={onBack}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Friend Avatar */}
        <div
          className="relative shrink-0 cursor-pointer"
          onClick={onOpenProfile}
        >
          {friend.profile_photo ? (
            <img src={friend.profile_photo} alt={friend.fullname} className="w-10 h-10 rounded-2xl object-cover border border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-base">
              {friend.fullname.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-500'}`}></div>
        </div>

        {/* User Info & Live Status */}
        <div className="min-w-0 cursor-pointer" onClick={onOpenProfile}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm truncate font-heading">{friend.fullname}</h3>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0">
              {friend.unique_id}
            </span>
          </div>

          <div className="text-xs">
            {isTyping ? (
              <span className="text-cyan-400 font-semibold animate-pulse flex items-center gap-1">
                typing...
              </span>
            ) : isOnline ? (
              <span className="text-emerald-400 font-medium">Online</span>
            ) : (
              <span className="text-slate-400">
                @{friend.username} • Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions & Dropdown */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          title="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenProfile}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          title="View Friend Profile"
        >
          <User className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-10 bg-slate-950 border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1 w-44 animate-in fade-in z-30">
              <button
                onClick={() => { onExportChat(); setShowOptions(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-cyan-400" /> Export Chat Log
              </button>
              <button
                onClick={() => { onClearChat(); setShowOptions(false); }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Clear Chat History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
