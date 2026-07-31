import React, { useState } from 'react';
import axios from 'axios';
import { Star, Pin, MessageSquare, MoreVertical, Trash2, Search, UserCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function FriendList({ friends, onSelectFriend, onRefreshFriends }) {
  const { onlineStatusMap } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const filteredFriends = friends.filter(f =>
    f.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFavorite = async (friendUserId, currentFav) => {
    try {
      await axios.put('/api/friends/action', {
        friend_user_id: friendUserId,
        is_favorite: !currentFav
      });
      if (onRefreshFriends) onRefreshFriends();
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const handleTogglePin = async (friendUserId, currentPin) => {
    try {
      await axios.put('/api/friends/action', {
        friend_user_id: friendUserId,
        is_pinned: !currentPin
      });
      if (onRefreshFriends) onRefreshFriends();
    } catch (err) {
      console.error('Toggle pin error:', err);
    }
  };

  const handleUnfriend = async (friendUserId) => {
    if (!window.confirm('Are you sure you want to unfriend this user?')) return;
    try {
      await axios.delete(`/api/friends/unfriend/${friendUserId}`);
      if (onRefreshFriends) onRefreshFriends();
    } catch (err) {
      alert('Failed to unfriend user.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Friends Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredFriends.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No friends found. Use the Search User button to connect with friends!
          </div>
        ) : (
          filteredFriends.map((f) => {
            const realtimeStatus = onlineStatusMap[f.id];
            const currentStatus = realtimeStatus?.status || f.status || 'offline';
            const isOnline = currentStatus === 'online';

            return (
              <div
                key={f.id}
                className="group relative bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/40 hover:border-slate-700/60 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer"
                onClick={() => onSelectFriend(f)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {f.profile_photo ? (
                      <img src={f.profile_photo} alt={f.fullname} className="w-11 h-11 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white text-base">
                        {f.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-500'}`}></div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-semibold text-white text-sm truncate">{f.fullname}</h5>
                      {f.is_pinned === 1 && <Pin className="w-3 h-3 text-cyan-400 fill-cyan-400 rotate-45 shrink-0" />}
                      {f.is_favorite === 1 && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">@{f.username} • {f.unique_id}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{f.bio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleFavorite(f.id, f.is_favorite === 1)}
                    className={`p-1.5 rounded-lg transition ${f.is_favorite === 1 ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
                    title={f.is_favorite === 1 ? 'Unstar Friend' : 'Star Favorite Friend'}
                  >
                    <Star className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTogglePin(f.id, f.is_pinned === 1)}
                    className={`p-1.5 rounded-lg transition ${f.is_pinned === 1 ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800'}`}
                    title={f.is_pinned === 1 ? 'Unpin Friend' : 'Pin Friend to Top'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleUnfriend(f.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Unfriend User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
