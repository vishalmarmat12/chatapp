import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Pin, Star, Search, MessageSquare, CheckCheck, Check } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function ConversationList({ friends, activeFriend, onSelectFriend }) {
  const { onlineStatusMap, typingUsers } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = friends.filter(f =>
    f.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.last_message && f.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return format(date, 'h:mm a');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM d');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search messages or friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
            No active conversations. Click "Friends" or "Find Friends" to start a chat!
          </div>
        ) : (
          filtered.map((f) => {
            const realtimeStatus = onlineStatusMap[f.id];
            const isOnline = (realtimeStatus?.status || f.status) === 'online';
            const isTyping = typingUsers[f.id];
            const isSelected = activeFriend?.id === f.id;

            return (
              <button
                key={f.id}
                onClick={() => onSelectFriend(f)}
                className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/30 shadow-md'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Avatar with Online Indicator */}
                <div className="relative shrink-0 mt-0.5">
                  {f.profile_photo ? (
                    <img src={f.profile_photo} alt={f.fullname} className="w-12 h-12 rounded-2xl object-cover border border-slate-700/80" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base shadow-md">
                      {f.fullname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-500'
                    }`}
                  ></div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h5 className="font-semibold text-white text-sm truncate">{f.fullname}</h5>
                      {f.is_pinned === 1 && <Pin className="w-3 h-3 text-cyan-400 fill-cyan-400 rotate-45 shrink-0" />}
                    </div>
                    {f.last_message_time && (
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                        {formatTimestamp(f.last_message_time)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isTyping ? (
                      <span className="text-xs text-cyan-400 font-semibold animate-pulse flex items-center gap-1">
                        <span>typing</span>
                        <span className="inline-flex gap-0.5">
                          <span className="animate-dot1">.</span>
                          <span className="animate-dot2">.</span>
                          <span className="animate-dot3">.</span>
                        </span>
                      </span>
                    ) : (
                      <p className="text-xs text-slate-400 truncate flex-1">
                        {f.last_message || <span className="text-slate-500 italic">No messages yet</span>}
                      </p>
                    )}

                    {f.unread_count > 0 && (
                      <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                        {f.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
