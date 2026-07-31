import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import api from '../config/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function ChatRoomScreen({ route, navigation }) {
  const { friend } = route.params;
  const { user } = useAuth();
  const { socket, onlineStatusMap, typingUsers, emitTyping, emitStopTyping, emitMarkRead } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/messages/history/${friend.id}`);
      setMessages(res.data.messages || []);
      emitMarkRead(friend.id);
    } catch (err) {
      console.log('Fetch mobile room messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: friend.fullname,
      headerSubtitle: friend.unique_id
    });
    fetchMessages();
  }, [friend.id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (
        (newMsg.sender_id === friend.id && newMsg.receiver_id === user.id) ||
        (newMsg.sender_id === user.id && newMsg.receiver_id === friend.id)
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id === friend.id) emitMarkRead(friend.id);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, friend.id, user.id]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const msgText = inputText.trim();
    setInputText('');

    if (socket && socket.connected) {
      socket.emit('send_message', {
        receiver_id: friend.id,
        message: msgText,
        message_type: 'text'
      }, (response) => {
        if (response?.error) {
          alert(response.error);
        }
      });
    }
  };

  const isOnline = (onlineStatusMap[friend.id]?.status || friend.status) === 'online';
  const isTyping = typingUsers[friend.id];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{friend.fullname}</Text>
          <Text style={styles.headerSubtitle}>
            {isTyping ? 'typing...' : isOnline ? 'Online' : `@${friend.username} • ${friend.unique_id}`}
          </Text>
        </View>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user.id;

            return (
              <View style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  {item.attachment && (
                    <View style={styles.attachmentView}>
                      <Text style={styles.attachmentText}>📎 {item.attachment.file_name}</Text>
                    </View>
                  )}
                  <Text style={[styles.messageText, isMe ? styles.myMsgTxt : styles.theirMsgTxt]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.timeText, isMe ? styles.myTimeTxt : styles.theirTimeTxt]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe ? ' ✓✓' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input Footer */}
      <View style={styles.inputFooter}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={(txt) => {
            setInputText(txt);
            emitTyping(friend.id);
          }}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backTxt: {
    color: '#06b6d4',
    fontSize: 22,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  bubbleWrapper: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myWrapper: {
    justifyContent: 'flex-end',
  },
  theirWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
  },
  myBubble: {
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMsgTxt: {
    color: '#ffffff',
  },
  theirMsgTxt: {
    color: '#f8fafc',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  myTimeTxt: {
    color: '#bae6fd',
  },
  theirTimeTxt: {
    color: '#64748b',
  },
  attachmentView: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 4,
  },
  attachmentText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#090d16',
    fontSize: 18,
    fontWeight: '800',
  },
});
