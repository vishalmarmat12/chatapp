import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';

import SidebarHeader from './components/sidebar/SidebarHeader';
import ConversationList from './components/sidebar/ConversationList';
import FriendList from './components/sidebar/FriendList';
import PendingRequestsList from './components/sidebar/PendingRequestsList';
import FriendSearchModal from './components/sidebar/FriendSearchModal';

import ChatHeader from './components/chat/ChatHeader';
import MessageStream from './components/chat/MessageStream';
import ChatInput from './components/chat/ChatInput';
import ChatSearchDrawer from './components/chat/ChatSearchDrawer';

import UserProfileModal from './components/profile/UserProfileModal';
import EditProfileModal from './components/profile/EditProfileModal';
import SettingsModal from './components/settings/SettingsModal';
import NotificationsModal from './components/profile/NotificationsModal';
import CalculatorVault from './components/vault/CalculatorVault';

import { MessageSquare, Users, UserCheck, Sparkles, ShieldCheck, UserPlus, Lock } from 'lucide-react';

export default function App() {
  const { user, token, loading: authLoading } = useAuth();
  const { socket } = useSocket();

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(() => sessionStorage.getItem('vault_unlocked') === 'true');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'friends', 'requests'

  // Data states
  const [friends, setFriends] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeFriend, setActiveFriend] = useState(null);

  // Chat states
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);

  // Modal states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Load Friends List
  const fetchFriends = async () => {
    try {
      const res = await axios.get('/api/friends/list');
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error('Fetch friends error:', err);
    }
  };

  // Load Pending Requests count
  const fetchRequestsCount = async () => {
    try {
      const res = await axios.get('/api/friends/requests/pending');
      setPendingRequestsCount((res.data.incoming || []).length);
    } catch (err) {
      console.error('Fetch requests count error:', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchFriends();
      fetchRequestsCount();
    }
  }, [token, user?.id]);

  // Listen to Socket notifications for new requests or messages
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', () => {
      fetchFriends();
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket]);

  // Send Message Handler
  const handleSendMessage = (msgPayload) => {
    if (!socket || !activeFriend) return;

    socket.emit('send_message', {
      receiver_id: activeFriend.id,
      message: msgPayload.message,
      message_type: msgPayload.message_type,
      reply_to_id: replyingToMessage?.id || null,
      attachment: msgPayload.attachment || null
    }, (response) => {
      if (response?.error) {
        alert(response.error);
      } else {
        setReplyingToMessage(null);
        fetchFriends();
      }
    });
  };

  // Export Chat Log
  const handleExportChat = async () => {
    if (!activeFriend) return;
    try {
      const res = await axios.get(`/api/messages/history/${activeFriend.id}`);
      const list = res.data.messages || [];

      const textOutput = list.map(m => `[${m.created_at}] ${m.sender_id === user.id ? 'You' : activeFriend.fullname}: ${m.message || m.attachment?.file_name || ''}`).join('\n');
      const element = document.createElement('a');
      const file = new Blob([textOutput], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `ByteChat-${activeFriend.username}-history.txt`;
      document.body.appendChild(element);
      element.click();
    } catch (e) {
      alert('Failed to export chat.');
    }
  };

  // Clear Chat History
  const handleClearChat = async () => {
    if (!activeFriend) return;
    if (!window.confirm(`Clear chat history with ${activeFriend.fullname}?`)) return;

    try {
      await axios.post('/api/messages/clear-chat', { friend_id: activeFriend.id });
      window.location.reload();
    } catch (e) {
      alert('Failed to clear chat.');
    }
  };

  const handleUnlockVault = () => {
    sessionStorage.setItem('vault_unlocked', 'true');
    setIsVaultUnlocked(true);
  };

  const handleLockVault = () => {
    sessionStorage.removeItem('vault_unlocked');
    setIsVaultUnlocked(false);
  };

  if (!isVaultUnlocked) {
    return <CalculatorVault onUnlock={handleUnlockVault} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-heading text-lg">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mr-3"></div>
        Initializing ByteChat Secure Messenger...
      </div>
    );
  }

  if (!token || !user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-80 lg:w-96 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 z-10 transition-all ${activeFriend ? 'hidden md:flex' : 'flex'}`}>
        <SidebarHeader
          pendingRequestsCount={pendingRequestsCount}
          onOpenSearchUsers={() => setShowSearchModal(true)}
          onOpenRequests={() => setActiveTab('requests')}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenEditProfile={() => setShowEditProfileModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onLockVault={handleLockVault}
        />

        {/* Sidebar Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'chats'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chats
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'friends'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Friends ({friends.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition relative ${
              activeTab === 'requests'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Requests
            {pendingRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Sidebar Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chats' && (
            <ConversationList
              friends={friends}
              activeFriend={activeFriend}
              onSelectFriend={(f) => setActiveFriend(f)}
            />
          )}

          {activeTab === 'friends' && (
            <FriendList
              friends={friends}
              onSelectFriend={(f) => setActiveFriend(f)}
              onRefreshFriends={fetchFriends}
            />
          )}

          {activeTab === 'requests' && (
            <PendingRequestsList
              onRequestAction={() => { fetchFriends(); fetchRequestsCount(); }}
            />
          )}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-slate-950 relative overflow-hidden ${!activeFriend ? 'hidden md:flex' : 'flex'}`}>
        {activeFriend ? (
          <>
            <ChatHeader
              friend={activeFriend}
              onBack={() => setActiveFriend(null)}
              onOpenProfile={() => { setSelectedProfileUser(activeFriend); setShowUserProfileModal(true); }}
              onOpenSearch={() => setShowSearchDrawer(!showSearchDrawer)}
              onClearChat={handleClearChat}
              onExportChat={handleExportChat}
            />

            <div className="flex-1 flex overflow-hidden relative">
              <MessageStream
                friend={activeFriend}
                replyingTo={replyingToMessage}
                onReply={(msg) => setReplyingToMessage(msg)}
                onCancelReply={() => setReplyingToMessage(null)}
                onClearChat={handleClearChat}
                onExportChat={handleExportChat}
              />

              <ChatSearchDrawer
                friend={activeFriend}
                isOpen={showSearchDrawer}
                onClose={() => setShowSearchDrawer(false)}
              />
            </div>

            <ChatInput
              friendId={activeFriend.id}
              replyingTo={replyingToMessage}
              onCancelReply={() => setReplyingToMessage(null)}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          /* Empty State Splash Banner */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/25 mb-6 animate-pulse-subtle">
              <MessageSquare className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-extrabold text-white font-heading tracking-tight">
              Welcome to ByteChat Private Messenger
            </h2>
            <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
              Enjoy 100% private one-to-one messaging without sharing your mobile number. Connect using your unique User ID or Username.
            </p>

            <div className="mt-6 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Your Unique ID is <strong className="font-mono text-cyan-400 font-bold">{user.unique_id}</strong>. Share it with friends so they can add you.</span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-3 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition"
              >
                <UserPlus className="w-4 h-4" /> Find & Add Friend
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-xs py-3 px-6 rounded-2xl transition"
              >
                View Requests ({pendingRequestsCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GLOBAL MODALS */}
      <FriendSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onRequestSent={fetchRequestsCount}
      />

      <UserProfileModal
        user={selectedProfileUser}
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        onStartChat={(u) => setActiveFriend(u)}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onLockVault={handleLockVault}
      />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </div>
  );
}
