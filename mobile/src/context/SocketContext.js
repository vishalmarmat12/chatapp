import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getStoredServerHost } from '../config/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineStatusMap, setOnlineStatusMap] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    let newSocket = null;
    let isCancelled = false;

    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const initSocket = async () => {
      const serverHost = await getStoredServerHost();
      if (isCancelled) return;

      newSocket = io(serverHost, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10
      });

      newSocket.on('connect', () => {
        console.log('⚡ React Native Socket Connected:', newSocket.id);
      });

      newSocket.on('user_status_change', ({ userId, status, last_seen }) => {
        setOnlineStatusMap(prev => ({
          ...prev,
          [userId]: { status, last_seen }
        }));
      });

      newSocket.on('user_typing', ({ sender_id }) => {
        setTypingUsers(prev => ({ ...prev, [sender_id]: true }));
      });

      newSocket.on('user_stop_typing', ({ sender_id }) => {
        setTypingUsers(prev => ({ ...prev, [sender_id]: false }));
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      isCancelled = true;
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token, user?.id]);

  const emitTyping = (receiverId) => {
    if (socket && socket.connected) socket.emit('typing', { receiver_id: receiverId });
  };

  const emitStopTyping = (receiverId) => {
    if (socket && socket.connected) socket.emit('stop_typing', { receiver_id: receiverId });
  };

  const emitMarkRead = (senderId) => {
    if (socket && socket.connected) socket.emit('mark_read', { sender_id: senderId });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      onlineStatusMap,
      typingUsers,
      emitTyping,
      emitStopTyping,
      emitMarkRead
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
