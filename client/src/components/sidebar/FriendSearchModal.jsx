import React, { useState } from 'react';
import axios from 'axios';
import { Search, UserPlus, X, Check, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export default function FriendSearchModal({ isOpen, onClose, onRequestSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (receiverId) => {
    setActionLoadingId(receiverId);
    try {
      await axios.post('/api/friends/request/send', { receiver_id: receiverId });
      // Update local state to reflect pending request
      setResults(prev => prev.map(u => u.id === receiverId ? { ...u, request_status: 'pending', request_sender: u.id } : u));
      if (onRequestSent) onRequestSent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send friend request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Find & Connect Friends</h3>
              <p className="text-xs text-slate-400">Search by Username (@vishal) or Unique ID (BYT10458)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Type @username or Unique User ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-28 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs py-2 px-4 rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              Enter a friend's Username or Unique ID to connect.
            </div>
          )}

          {results.map((u) => {
            const isFriend = !!u.friend_id;
            const isPending = u.request_status === 'pending';

            return (
              <div
                key={u.id}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    {u.profile_photo ? (
                      <img src={u.profile_photo} alt={u.fullname} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white text-lg">
                        {u.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm truncate">{u.fullname}</h4>
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold">
                        {u.unique_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{u.bio || 'Hey there! I am using ByteChat.'}</p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isFriend ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-xl font-medium">
                      <Check className="w-3.5 h-3.5" /> Friends
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1.5 rounded-xl font-medium">
                      <Clock className="w-3.5 h-3.5" /> Requested
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      disabled={actionLoadingId === u.id}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {actionLoadingId === u.id ? 'Sending...' : 'Add Friend'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
