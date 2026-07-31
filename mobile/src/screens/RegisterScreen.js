import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStoredServerHost, setCustomServerHost, PRODUCTION_SERVER_HOST, LOCAL_EMULATOR_HOST } from '../config/api';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  // Server Host Config Modal State
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentHost, setCurrentHost] = useState('');
  const [inputHost, setInputHost] = useState('');

  useEffect(() => {
    loadServerHost();
  }, []);

  const loadServerHost = async () => {
    const host = await getStoredServerHost();
    setCurrentHost(host);
    setInputHost(host);
  };

  const handleSaveHost = async (hostToSave) => {
    await setCustomServerHost(hostToSave);
    await loadServerHost();
    setShowServerModal(false);
    Alert.alert('Server Updated', `Backend server set to:\n${hostToSave || PRODUCTION_SERVER_HOST}`);
  };

  const handleRegister = async () => {
    if (!fullname.trim() || !username.trim() || !password) {
      Alert.alert('Missing Required Fields', 'Please fill in Full Name, Username, and Password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(fullname.trim(), username.trim(), email.trim(), password, bio.trim());
    } catch (err) {
      console.log('Registration error:', err);
      const errMsg = err.response?.data?.error 
        || (err.message?.includes('Network Error') ? `Unable to reach backend server at:\n${currentHost}\n\nTap "⚙️ Server Settings" below to configure server address.` : err.message)
        || 'Registration failed.';
      Alert.alert('Registration Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Get an auto-generated Unique User ID (`BYTXXXXX`)</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Rahul Kumar"
            placeholderTextColor="#64748b"
            value={fullname}
            onChangeText={setFullname}
          />

          <Text style={styles.label}>Username (Unique) *</Text>
          <TextInput
            style={styles.input}
            placeholder="rahul_dev"
            placeholderTextColor="#64748b"
            value={username}
            onChangeText={(txt) => setUsername(txt.toLowerCase().replace(/\s+/g, ''))}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="rahul@example.com (Optional)"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password (min 8 chars) *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Bio / Status (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Private chat enthusiast..."
            placeholderTextColor="#64748b"
            value={bio}
            onChangeText={setBio}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>Register & Generate ID</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchAuthText}>
              Already have an account? <Text style={styles.highlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          {/* Server Config Trigger Button */}
          <TouchableOpacity
            style={styles.serverConfigBtn}
            onPress={() => setShowServerModal(true)}
          >
            <Text style={styles.serverConfigBtnTxt}>⚙️ Server Settings ({currentHost.replace('https://', '').replace('http://', '')})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Server Settings Modal */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚙️ Backend Server Host</Text>
            <Text style={styles.modalSubtitle}>Configure API address for real device or cloud server connection.</Text>

            <TextInput
              style={styles.input}
              value={inputHost}
              onChangeText={setInputHost}
              placeholder="https://chatapp-calculator-vault.onrender.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <View style={styles.presetContainer}>
              <TouchableOpacity
                style={styles.presetBadge}
                onPress={() => setInputHost(PRODUCTION_SERVER_HOST)}
              >
                <Text style={styles.presetBadgeTxt}>🌐 Cloud Host</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetBadge}
                onPress={() => setInputHost(LOCAL_EMULATOR_HOST)}
              >
                <Text style={styles.presetBadgeTxt}>💻 Local Host</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSaveHost(inputHost)}
            >
              <Text style={styles.buttonText}>Save & Apply Server</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowServerModal(false)}
            >
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#06b6d4',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#06b6d4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 14,
  },
  switchAuth: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  highlight: {
    color: '#06b6d4',
    fontWeight: '700',
  },
  serverConfigBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    backgroundColor: '#020617',
  },
  serverConfigBtnTxt: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  presetBadge: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBadgeTxt: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnTxt: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
