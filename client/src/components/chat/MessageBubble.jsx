import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Reply, Edit2, Trash2, Copy, FileText, Download, Play, Pause, CornerUpLeft, MoreHorizontal, File } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MessageBubble({
  message,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone
}) {
  const { user } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioObj, setAudioObj] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const isMe = message.sender_id === user?.id;

  // Format message time
  let formattedTime = '';
  try {
    formattedTime = format(new Date(message.created_at), 'h:mm a');
  } catch (e) {
    formattedTime = '';
  }

  // Toggle Voice Note playback
  const handleToggleAudio = (filePath) => {
    if (isPlayingAudio && audioObj) {
      audioObj.pause();
      setIsPlayingAudio(false);
    } else {
      const newAudio = new Audio(filePath);
      newAudio.onended = () => setIsPlayingAudio(false);
      newAudio.play();
      setAudioObj(newAudio);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.message || '');
    setShowMenu(false);
  };

  return (
    <div
      className={`group relative flex flex-col my-1 px-4 ${isMe ? 'items-end' : 'items-start'}`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md border transition ${
        isMe
          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30 rounded-tr-none'
          : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none'
      }`}>
        {/* Reply Quote Banner */}
        {message.reply_message && (
          <div className={`mb-2 p-2 rounded-xl text-xs border-l-4 ${
            isMe ? 'bg-black/20 border-white/60 text-slate-100' : 'bg-slate-950 border-cyan-400 text-slate-300'
          }`}>
            <p className="font-semibold text-[10px] opacity-80 flex items-center gap-1">
              <CornerUpLeft className="w-3 h-3" /> Replying to message
            </p>
            <p className="truncate italic mt-0.5">{message.reply_message}</p>
          </div>
        )}

        {/* Attachment Renderer */}
        {message.attachment && (
          <div className="mb-2">
            {message.attachment.file_type === 'image' ? (
              <img
                src={message.attachment.file_path}
                alt={message.attachment.file_name}
                className="max-h-64 rounded-xl object-cover border border-black/20 shadow-sm"
              />
            ) : message.attachment.file_type === 'voice' ? (
              <div className={`flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-black/20' : 'bg-slate-950'}`}>
                <button
                  onClick={() => handleToggleAudio(message.attachment.file_path)}
                  className={`p-2.5 rounded-full shadow transition ${isMe ? 'bg-white text-cyan-600' : 'bg-cyan-500 text-slate-950'}`}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Voice Note</p>
                  <p className="text-[10px] opacity-70">Click to listen</p>
                </div>
              </div>
            ) : (
              <a
                href={message.attachment.file_path}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-3 p-3 rounded-xl transition ${isMe ? 'bg-black/20 hover:bg-black/30' : 'bg-slate-950 hover:bg-slate-800'}`}
              >
                <File className="w-6 h-6 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{message.attachment.file_name}</p>
                  <p className="text-[10px] opacity-70 font-mono">{(message.attachment.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <Download className="w-4 h-4 opacity-80" />
              </a>
            )}
          </div>
        )}

        {/* Main Text Content */}
        {message.message && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.message}
          </p>
        )}

        {/* Timestamp & Read Receipts */}
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${isMe ? 'text-cyan-100' : 'text-slate-400'}`}>
          {message.edited === 1 && <span className="italic opacity-80">edited</span>}
          <span>{formattedTime}</span>

          {isMe && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-slate-300 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-300 inline" />
              )}
            </span>
          )}
        </div>

        {/* Floating Context Action Trigger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`absolute top-2 ${isMe ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition p-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Context Dropdown Menu */}
        {showMenu && (
          <div className={`absolute top-8 z-30 ${isMe ? 'left-2' : 'right-2'} bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-2xl space-y-0.5 min-w-[130px] animate-in fade-in`}>
            <button
              onClick={() => { onReply(message); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <Reply className="w-3.5 h-3.5 text-cyan-400" /> Reply
            </button>
            <button
              onClick={handleCopyText}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
            </button>

            {isMe && message.deleted_for_everyone !== 1 && (
              <button
                onClick={() => { onEdit(message); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Edit
              </button>
            )}

            <button
              onClick={() => { onDeleteForMe(message.id); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete For Me
            </button>

            {isMe && message.deleted_for_everyone !== 1 && (
              <button
                onClick={() => { onDeleteForEveryone(message.id); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
