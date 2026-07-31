import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import api from '../config/api';

export default function FriendsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'requests'
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to search users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/friends/requests/pending');
      setIncomingRequests(res.data.incoming || []);
    } catch (err) {
      console.log('Fetch requests error:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sendRequest = async (receiverId) => {
    try {
      await api.post('/api/friends/request/send', { receiver_id: receiverId });
      Alert.alert('Success', 'Friend request sent!');
      handleSearch();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send friend request.');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await api.post('/api/friends/request/accept', { request_id: requestId });
      Alert.alert('Accepted', 'You are now friends!');
      fetchRequests();
    } catch (err) {
      Alert.alert('Error', 'Failed to accept request.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Tab Toggle */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'search' && styles.activeTabBtn]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabTxt, activeTab === 'search' && styles.activeTabTxt]}>Find Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'requests' && styles.activeTabBtn]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabTxt, activeTab === 'requests' && styles.activeTabTxt]}>
            Requests ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by @username or Unique User ID..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnTxt}>Search</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#06b6d4" />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.fullname}</Text>
                    <Text style={styles.subtext}>@{item.username} • {item.unique_id}</Text>
                  </View>
                  {item.friend_id ? (
                    <Text style={styles.badge}>Friends</Text>
                  ) : item.request_status === 'pending' ? (
                    <Text style={styles.badgePending}>Requested</Text>
                  ) : (
                    <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(item.id)}>
                      <Text style={styles.addBtnTxt}>+ Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={incomingRequests}
          keyExtractor={(item) => item.request_id}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#64748b' }}>No pending friend requests.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullname}</Text>
                <Text style={styles.subtext}>@{item.username} • {item.unique_id}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => acceptRequest(item.request_id)}>
                <Text style={styles.addBtnTxt}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 6,
    margin: 12,
    borderRadius: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabBtn: {
    backgroundColor: '#0284c7',
  },
  tabTxt: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabTxt: {
    color: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnTxt: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 13,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  name: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  subtext: {
    color: '#06b6d4',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  badgePending: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
  },
  addBtn: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnTxt: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 12,
  },
});
