import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Clock, Check, X, ShieldAlert } from 'lucide-react';

export default function PendingRequestsList({ onRequestAction }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/friends/requests/pending');
      setIncoming(res.data.incoming || []);
      setOutgoing(res.data.outgoing || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    setActionId(requestId);
    try {
      await axios.post('/api/friends/request/accept', { request_id: requestId });
      fetchRequests();
      if (onRequestAction) onRequestAction();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept friend request.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionId(requestId);
    try {
      await axios.post('/api/friends/request/reject', { request_id: requestId });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject friend request.');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (requestId) => {
    setActionId(requestId);
    try {
      await axios.post('/api/friends/request/cancel', { request_id: requestId });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel friend request.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading pending requests...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Incoming Friend Requests */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Incoming Requests</span>
          <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {incoming.length}
          </span>
        </h4>

        {incoming.length === 0 ? (
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
            No incoming friend requests.
          </div>
        ) : (
          <div className="space-y-2.5">
            {incoming.map((req) => (
              <div
                key={req.request_id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {req.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white text-sm truncate">{req.fullname}</h5>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <span>@{req.username}</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-cyan-400">{req.unique_id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(req.request_id)}
                    disabled={actionId === req.request_id}
                    className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    title="Accept Friend Request"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Accept</span>
                  </button>

                  <button
                    onClick={() => handleReject(req.request_id)}
                    disabled={actionId === req.request_id}
                    className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    title="Decline Friend Request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Friend Requests */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Sent Requests</span>
          <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {outgoing.length}
          </span>
        </h4>

        {outgoing.length === 0 ? (
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
            No outgoing requests sent.
          </div>
        ) : (
          <div className="space-y-2.5">
            {outgoing.map((req) => (
              <div
                key={req.request_id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                    {req.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white text-sm truncate">{req.fullname}</h5>
                    <p className="text-xs text-slate-400 font-mono">@{req.username} • {req.unique_id}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(req.request_id)}
                  disabled={actionId === req.request_id}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-medium transition"
                >
                  Cancel Request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
