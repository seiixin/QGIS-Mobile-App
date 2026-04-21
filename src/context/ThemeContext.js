/**
 * ThemeContext — derives live theme values from AuthContext settings.
 * high_contrast is stored locally (AsyncStorage) since the backend
 * doesn't have that column yet.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);
const HC_KEY = 'smartquake_high_contrast';

const FONT_SCALE = { S: 0.85, M: 1.0, L: 1.2 };

export function ThemeProvider({ children }) {
  const { settings } = useAuth();
  const [highContrast, setHighContrastState] = useState(false);

  // Load high contrast from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(HC_KEY).then(val => {
      if (val === 'true') setHighContrastState(true);
    }).catch(() => {});
  }, []);

  // Setter that also persists to AsyncStorage
  const setHighContrast = async (value) => {
    setHighContrastState(value);
    await AsyncStorage.setItem(HC_KEY, value ? 'true' : 'false').catch(() => {});
  };

  const theme = useMemo(() => {
    const dark      = Boolean(settings.dark_mode);
    const contrast  = highContrast;
    const fontScale = FONT_SCALE[settings.fontSizeLabel] ?? 1.0;

    return {
      dark,
      fontScale,
      highContrast: contrast,
      setHighContrast,
      tts: Boolean(settings.text_to_speech),

      // Backgrounds
      bg:    dark ? '#0D1B2A' : '#EAF0FB',
      card:  dark ? '#1B2A4A' : '#FFFFFF',
      navBg: dark ? '#0A1628' : '#1B2A4A',

      // Text — high contrast forces pure black/white
      textPrimary:   contrast ? (dark ? '#FFFFFF' : '#000000') : (dark ? '#E8EDF5' : '#1B2A4A'),
      textSecondary: contrast ? (dark ? '#EEEEEE' : '#111111') : (dark ? '#A0B0C8' : '#4A5568'),
      textMuted:     contrast ? (dark ? '#CCCCCC' : '#444444') : (dark ? '#6B7E99' : '#8A9BB5'),

      // Borders — thicker in high contrast
      border:    contrast ? (dark ? '#FFFFFF' : '#000000') : (dark ? '#2A3D5A' : '#D0D8F0'),
      borderWidth: contrast ? 2 : 1,

      // Accent / status
      accent:  '#3B4FE0',
      danger:  '#E74C3C',
      success: '#27AE60',

      // Input
      inputBg: dark ? '#1B2A4A' : '#F5F7FF',

      // Font size helper
      fs: (base) => Math.round(base * fontScale),
    };
  }, [settings.dark_mode, settings.fontSizeLabel, settings.text_to_speech, highContrast]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
