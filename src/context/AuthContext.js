import React, { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

const AuthContext = createContext(null);

function normalizeFontSize(value) {
  if (value === 'small' || value === 'S') {
    return 'S';
  }

  if (value === 'large' || value === 'L') {
    return 'L';
  }

  return 'M';
}

const defaultSettings = {
  language: 'English',
  font_size: 'medium',
  dark_mode: false,
  text_to_speech: false,
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);

  const refreshSettings = async (nextToken = token) => {
    if (!nextToken) {
      return null;
    }

    try {
      const nextSettings = await apiRequest('/settings', { token: nextToken });
      setSettings((current) => ({ ...current, ...nextSettings }));
      return nextSettings;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  };

  const signIn = async ({ login, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { login, password },
    });

    setToken(data.token);
    setUser(data.user);
    await refreshSettings(data.token);
    return data;
  };

  const signUp = async ({ name, username, email, password, confirmPassword }) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name,
        username,
        email,
        password,
        password_confirmation: confirmPassword,
      },
    });

    setToken(data.token);
    setUser(data.user);
    await refreshSettings(data.token);
    return data;
  };

  const signOut = async () => {
    const currentToken = token;

    setToken(null);
    setUser(null);
    setSettings(defaultSettings);

    if (!currentToken) {
      return;
    }

    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token: currentToken,
      });
    } catch {
      // Ignore logout errors after local session cleanup.
    }
  };

  const updateSettings = async (payload) => {
    const nextSettings = await apiRequest('/settings', {
      method: 'PUT',
      token,
      body: payload,
    });

    setSettings((current) => ({ ...current, ...nextSettings }));
    return nextSettings;
  };

  const value = useMemo(() => ({
    token,
    user,
    settings: {
      ...settings,
      fontSizeLabel: normalizeFontSize(settings.font_size),
    },
    isAuthenticated: Boolean(token && user),
    signIn,
    signUp,
    signOut,
    refreshSettings,
    updateSettings,
  }), [token, user, settings]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
