import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Paperclip, Mic, StopCircle, Smile, X, Image, FileText, CornerUpLeft } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function ChatInput({
  friendId,
  replyingTo,
  onCancelReply,
  onSendMessage
}) {
  const { emitTyping, emitStopTyping } = useSocket();
  const [text, setText] = useState('');
  const [showEmojiQuick, setShowEmojiQuick] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const quickEmojis = ['😊', '😂', '🔥', '❤️', '👍', '🙏', '🎉', '👀', '💯', '✨'];

  // Handle typing debounce
  const handleTextChange = (e) => {
    setText(e.target.value);

    emitTyping(friendId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(friendId);
    }, 2000);
  };

  // Handle File Upload Attachment
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachment(res.data);
    } catch (err) {
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

        setUploading(true);
        const formData = new FormData();
        formData.append('file', audioFile);

        try {
          const res = await axios.post('/api/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Auto send voice note
          onSendMessage({
            message: '',
            message_type: 'voice',
            attachment: res.data
          });
        } catch (err) {
          alert('Failed to process voice recording.');
        } finally {
          setUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone permission required for voice notes.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop audio stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;

    onSendMessage({
      message: text.trim(),
      message_type: attachment ? attachment.file_type : 'text',
      attachment
    });

    setText('');
    setAttachment(null);
    setShowEmojiQuick(false);
    emitStopTyping(friendId);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 p-3 shrink-0 relative z-20">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-slate-950 border-l-4 border-cyan-500 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-cyan-400 font-semibold">Replying to: </span>
              <span className="text-slate-300 truncate italic">{replyingTo.message || replyingTo.attachment?.file_name || 'Attachment'}</span>
            </div>
          </div>
          <button onClick={onCancelReply} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-white truncate font-medium">{attachment.file_name}</span>
          </div>
          <button onClick={() => setAttachment(null)} className="text-slate-400 hover:text-rose-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiQuick && (
        <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 overflow-x-auto animate-in fade-in">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setText(prev => prev + emoji)}
              className="text-lg hover:scale-125 transition p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Recording Mode Input Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
            <span className="text-xs font-semibold text-rose-400 font-mono">
              Recording Voice Note... ({recordingTime}s)
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg"
          >
            <StopCircle className="w-4 h-4" /> Stop & Send
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition"
            title="Attach file or photo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiQuick(!showEmojiQuick)}
            className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a secure message..."
              value={text}
              onChange={handleTextChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Voice Record or Send Button */}
          {text.trim() || attachment ? (
            <button
              type="submit"
              disabled={uploading}
              className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-lg shadow-cyan-500/25 transition transform active:scale-95 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-3 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-2xl border border-slate-700 transition"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
