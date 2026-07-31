import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Deployed production cloud backend URL fallback
export const PRODUCTION_SERVER_HOST = 'https://chatapp-calculator-vault.onrender.com';

// Local emulator default host IP: localhost for iOS simulator, 10.0.2.2 for Android emulator
export const LOCAL_EMULATOR_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const DEFAULT_SERVER_HOST = PRODUCTION_SERVER_HOST;

export const getStoredServerHost = async () => {
  try {
    const customHost = await AsyncStorage.getItem('chatnest_custom_server_host');
    if (customHost && customHost.trim()) {
      return customHost.trim().replace(/\/+$/, '');
    }
  } catch (e) {
    console.error('Error reading custom server host:', e);
  }
  return DEFAULT_SERVER_HOST;
};

export const setCustomServerHost = async (hostUrl) => {
  try {
    if (!hostUrl || !hostUrl.trim()) {
      await AsyncStorage.removeItem('chatnest_custom_server_host');
    } else {
      let formatted = hostUrl.trim().replace(/\/+$/, '');
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = `http://${formatted}`;
      }
      await AsyncStorage.setItem('chatnest_custom_server_host', formatted);
    }
  } catch (e) {
    console.error('Error setting custom server host:', e);
  }
};

const api = axios.create({
  baseURL: DEFAULT_SERVER_HOST,
  timeout: 12000,
});

api.interceptors.request.use(
  async (config) => {
    // Dynamically update baseURL if user set a custom host or to match effective host
    const effectiveHost = await getStoredServerHost();
    config.baseURL = effectiveHost;

    const token = await AsyncStorage.getItem('chatnest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
