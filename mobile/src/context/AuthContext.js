import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('chatnest_token');
      if (storedToken) {
        setToken(storedToken);
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      }
    } catch (err) {
      console.log('Failed to load mobile user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginIdentifier, password) => {
    const res = await api.post('/api/auth/login', { loginIdentifier, password });
    const { token: newToken, user: userData } = res.data;
    await AsyncStorage.setItem('chatnest_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (fullname, username, email, password, bio) => {
    const res = await api.post('/api/auth/register', { fullname, username, email, password, bio });
    const { token: newToken, user: userData } = res.data;
    await AsyncStorage.setItem('chatnest_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('chatnest_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
