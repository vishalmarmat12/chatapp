import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShieldOff, UserCheck } from 'lucide-react';

export default function BlockedUsersModal({ isOpen, onClose }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = async () => {
    try {
      const res = await axios.get('/api/settings/blocked-list');
      setBlockedUsers(res.data.blocked_users || []);
    } catch (err) {
      console.error('Fetch blocked list error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchBlocked();
  }, [isOpen]);

  const handleUnblock = async (userId) => {
    try {
      await axios.post('/api/settings/unblock', { user_to_unblock_id: userId });
      fetchBlocked();
    } catch (err) {
      alert('Failed to unblock user.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl">
              <ShieldOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Blocked Users</h3>
              <p className="text-xs text-slate-400">Users who cannot send you messages</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-6">Loading blocked list...</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No blocked users.</p>
          ) : (
            blockedUsers.map((u) => (
              <div key={u.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white text-xs">{u.fullname}</h5>
                  <p className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.unique_id}</p>
                </div>
                <button
                  onClick={() => handleUnblock(u.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
