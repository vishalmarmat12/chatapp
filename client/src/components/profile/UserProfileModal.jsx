import React from 'react';
import { X, Calendar, ShieldCheck, Copy, Check, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function UserProfileModal({ user, isOpen, onClose, onStartChat }) {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.unique_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let formattedDate = 'Recently';
  try {
    if (user.created_at) formattedDate = format(new Date(user.created_at), 'MMMM yyyy');
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black/40 hover:bg-black/70 p-2 rounded-full backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-700 relative">
          {user.cover_photo && (
            <img src={user.cover_photo} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Avatar & Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="relative">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.fullname} className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-900 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 border-4 border-slate-900 shadow-xl flex items-center justify-center text-white text-3xl font-bold font-heading">
                  {user.fullname.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
            </div>

            {onStartChat && (
              <button
                onClick={() => { onStartChat(user); onClose(); }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white font-heading">{user.fullname}</h3>
            <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
          </div>

          {/* Unique ID Badge */}
          <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Unique User ID</p>
              <p className="text-sm font-mono font-bold text-cyan-400">{user.unique_id}</p>
            </div>
            <button
              onClick={handleCopyId}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">About Bio</h4>
            <p className="text-sm text-slate-200 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 leading-relaxed">
              {user.bio || 'Hey there! I am using ByteChat.'}
            </p>
          </div>

          {/* Meta Details */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Joined {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Private Chat Account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
