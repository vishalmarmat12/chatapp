import React, { useState } from 'react';
import axios from 'axios';
import { Search, X, MessageSquare, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatSearchDrawer({ friend, isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/messages/search/${friend.id}?q=${encodeURIComponent(query)}`);
      setResults(res.data.messages || []);
    } catch (err) {
      console.error('Search in chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-0 top-16 bottom-0 w-full sm:w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2 font-heading">
          <Search className="w-4 h-4 text-cyan-400" />
          Search Conversation
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSearch} className="p-3 border-b border-slate-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-16 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1 top-1 bg-cyan-500 text-slate-950 font-semibold text-[11px] px-3 py-1 rounded-lg"
          >
            {loading ? '...' : 'Find'}
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {results.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-500 py-8">
            Type keywords to search within this chat thread.
          </p>
        )}

        {results.map((msg) => (
          <div key={msg.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>{msg.sender_id === friend.id ? friend.fullname : 'You'}</span>
              <span>{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
            </div>
            <p className="text-slate-200">{msg.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
