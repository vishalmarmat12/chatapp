import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageSquare, ShieldCheck, Lock, Edit3, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function MessageStream({
  friend,
  replyingTo,
  onReply,
  onCancelReply,
  onClearChat,
  onExportChat
}) {
  const { user } = useAuth();
  const { socket, emitMarkRead } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Message modal state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  const bottomRef = useRef(null);

  // Fetch initial message history with active friend
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/messages/history/${friend.id}`);
      setMessages(res.data.messages || []);
      emitMarkRead(friend.id);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (friend?.id) {
      setLoading(true);
      fetchMessages();
    }
  }, [friend?.id]);

  // Real-time message listeners via Socket
  useEffect(() => {
    if (!socket || !friend?.id) return;

    const handleNewMessage = (newMsg) => {
      if (
        (newMsg.sender_id === friend.id && newMsg.receiver_id === user.id) ||
        (newMsg.sender_id === user.id && newMsg.receiver_id === friend.id)
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_id === friend.id) {
          emitMarkRead(friend.id);
        }
      }
    };

    const handleMessagesRead = ({ reader_id }) => {
      if (reader_id === friend.id) {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, friend?.id, user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleDeleteForMe = async (messageId) => {
    try {
      await axios.post('/api/messages/delete-for-me', { message_id: messageId });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      alert('Failed to delete message.');
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      await axios.post('/api/messages/delete-for-everyone', { message_id: messageId });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message: '🚫 This message was deleted.', deleted_for_everyone: 1, attachment: null } : m));
    } catch (err) {
      alert('Failed to delete message for everyone.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMessage || !editText.trim()) return;

    try {
      await axios.put(`/api/messages/edit/${editingMessage.id}`, { new_message: editText.trim() });
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, message: editText.trim(), edited: 1 } : m));
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      alert('Failed to edit message.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"></div>
        Loading encrypted message stream...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {/* End-to-end type Privacy Banner */}
      <div className="max-w-md mx-auto p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2 shadow-sm">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>Messages are private and visible only to confirmed friends.</span>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
          <p className="font-semibold text-slate-300">Say hello to {friend.fullname}!</p>
          <p className="text-xs text-slate-500 mt-1">This is the beginning of your private chat history.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onReply={onReply}
            onEdit={(m) => { setEditingMessage(m); setEditText(m.message || ''); }}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
          />
        ))
      )}

      <div ref={bottomRef} />

      {/* Edit Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" /> Edit Message
              </h3>
              <button onClick={() => setEditingMessage(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMessage(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-semibold"
                >
                  Save Edit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
