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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !password) {
      Alert.alert('Error', 'Please enter your Username, Email, or Unique ID and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier.trim(), password);
    } catch (err) {
      console.log('Login error:', err);
      const errMsg = err.response?.data?.error 
        || (err.message?.includes('Network Error') ? `Unable to reach backend server at:\n${currentHost}\n\nTap "⚙️ Server Settings" below to configure server address.` : err.message)
        || 'Login failed.';
      Alert.alert('Login Failed', errMsg);
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
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💬</Text>
          </View>
          <Text style={styles.title}>ByteChat</Text>
          <Text style={styles.subtitle}>Private Messenger (No Mobile Number)</Text>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Username, Email, or Unique ID</Text>
          <TextInput
            style={styles.input}
            placeholder="username, email, or BYTXXXXX"
            placeholderTextColor="#64748b"
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>Sign In to ByteChat</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.switchAuthText}>
              Don't have an account? <Text style={styles.highlight}>Create Account</Text>
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
    marginBottom: 36,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#06b6d4',
    marginTop: 4,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#06b6d4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#090d16',
    fontWeight: '800',
    fontSize: 15,
  },
  switchAuth: {
    marginTop: 20,
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
