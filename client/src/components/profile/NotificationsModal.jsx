import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, Check, Trash2, UserPlus, CheckCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Notifications</h3>
              <p className="text-xs text-slate-400">Friend updates and system alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold p-1"
            >
              Mark Read
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-8">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition flex items-start justify-between ${
                  n.is_read === 1
                    ? 'bg-slate-950/40 border-slate-800/60'
                    : 'bg-slate-950 border-cyan-500/30 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl mt-0.5 shrink-0">
                    {n.type === 'friend_request' ? <UserPlus className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white text-xs">{n.title}</h5>
                    <p className="text-xs text-slate-300 mt-0.5">{n.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {format(new Date(n.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
