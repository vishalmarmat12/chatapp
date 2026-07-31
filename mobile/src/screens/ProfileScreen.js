import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', { bio });
      setUser(res.data.user);
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Avatar */}
      <View style={styles.avatarHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLetter}>{user.fullname?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.fullname}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      {/* Unique ID Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Unique User ID</Text>
        <Text style={styles.uniqueId}>{user.unique_id}</Text>
        <Text style={styles.cardHint}>Share this ID with friends so they can add you without a phone number.</Text>
      </View>

      {/* Bio Editing */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Bio / Status</Text>
        <TextInput
          style={styles.bioInput}
          multiline
          value={bio}
          onChangeText={setBio}
          placeholder="Update your status..."
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBio} disabled={saving}>
          <Text style={styles.saveBtnTxt}>{saving ? 'Saving...' : 'Save Bio'}</Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnTxt}>Logout of ByteChat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 20,
  },
  avatarHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  username: {
    fontSize: 13,
    color: '#06b6d4',
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  uniqueId: {
    fontSize: 20,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 1,
  },
  cardHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 16,
  },
  bioInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    minHeight: 60,
  },
  saveBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnTxt: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutBtnTxt: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 14,
  },
});
