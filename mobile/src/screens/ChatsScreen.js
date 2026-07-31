import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl
} from 'react-native';
import api from '../config/api';
import { useSocket } from '../context/SocketContext';

export default function ChatsScreen({ navigation }) {
  const { onlineStatusMap, typingUsers } = useSocket();
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const fetchFriends = async () => {
    try {
      const res = await api.get('/api/friends/list');
      setFriends(res.data.friends || []);
    } catch (err) {
      console.log('Fetch mobile friends error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const filteredFriends = friends.filter(f =>
    f.fullname.toLowerCase().includes(query.toLowerCase()) ||
    f.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats or friends..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFriends(); }} tintColor="#06b6d4" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active chats yet.</Text>
            <Text style={styles.emptySubtext}>Use Friends tab to find and add friends!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusObj = onlineStatusMap[item.id];
          const isOnline = (statusObj?.status || item.status) === 'online';
          const isTyping = typingUsers[item.id];

          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => navigation.navigate('ChatRoom', { friend: item })}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {item.profile_photo ? (
                  <Image source={{ uri: item.profile_photo }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{item.fullname.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#64748b' }]} />
              </View>

              {/* Information */}
              <View style={styles.chatDetails}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.name}>{item.fullname}</Text>
                  <Text style={styles.uniqueId}>{item.unique_id}</Text>
                </View>

                {isTyping ? (
                  <Text style={styles.typingText}>typing...</Text>
                ) : (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message || 'Tap to start private chat'}
                  </Text>
                )}
              </View>

              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  searchBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#090d16',
  },
  chatDetails: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  uniqueId: {
    color: '#06b6d4',
    fontSize: 10,
    backgroundColor: '#06b6d420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
  },
  lastMessage: {
    color: '#94a3b8',
    fontSize: 13,
  },
  typingText: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadText: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 11,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});
