import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('chatnest_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default axios header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        setSettings(res.data.settings);
      } catch (err) {
        console.error('Failed to load profile, logging out:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (loginIdentifier, password) => {
    const res = await axios.post('/api/auth/login', { loginIdentifier, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatnest_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (fullname, username, email, password, bio) => {
    const res = await axios.post('/api/auth/register', { fullname, username, email, password, bio });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatnest_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('chatnest_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setSettings(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const updateUserSettings = (updatedSettings) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      settings,
      loading,
      login,
      register,
      logout,
      updateUserProfile,
      updateUserSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
