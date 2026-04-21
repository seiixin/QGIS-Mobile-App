import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

const FONT_MAP = { S: 'small', M: 'medium', L: 'large' };
const LANGUAGES = ['English', 'Tagalog', 'Kapampangan'];

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, signOut } = useAuth();

  const [darkMode,     setDarkMode]     = useState(Boolean(settings.dark_mode));
  const [highContrast, setHighContrast] = useState(Boolean(settings.high_contrast));
  const [tts,          setTts]          = useState(Boolean(settings.text_to_speech));
  const [fontSize,     setFontSize]     = useState(settings.fontSizeLabel || 'M');
  const [language,     setLanguage]     = useState(settings.language || 'English');
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState('');
  const [error,        setError]        = useState('');

  useEffect(() => {
    setDarkMode(Boolean(settings.dark_mode));
    setHighContrast(Boolean(settings.high_contrast));
    setTts(Boolean(settings.text_to_speech));
    setFontSize(settings.fontSizeLabel || 'M');
    setLanguage(settings.language || 'English');
  }, [settings]);

  const persist = async (partial, label) => {
    try {
      setSaving(true);
      setError('');
      await updateSettings(partial);
      if (label) {
        setToast(label);
        setTimeout(() => setToast(''), 2000);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />

      {/* Hero */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Settings</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Appearance, accessibility, and account preferences</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 20 }}>⚙️</Text></View>
        </View>
      </View>

      {/* Toast */}
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {toast}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {saving && <ActivityIndicator color={colors.btnPrimary} style={styles.loader} />}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch value={darkMode}
              onValueChange={(v) => { setDarkMode(v); persist({ dark_mode: v }, 'Dark mode updated'); }}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Font size</Text>
            <View style={styles.segmented}>
              {['S', 'M', 'L'].map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.segBtn, fontSize === s && styles.segBtnActive]}
                  onPress={() => { setFontSize(s); persist({ font_size: FONT_MAP[s] }, `Font size: ${s}`); }}>
                  <Text style={[styles.segBtnText, fontSize === s && styles.segBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>High contrast</Text>
            <Switch value={highContrast}
              onValueChange={(v) => { setHighContrast(v); persist({ high_contrast: v }, 'High contrast updated'); }}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>
        </View>

        {/* Accessibility */}
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Text-to-speech</Text>
            <Switch value={tts}
              onValueChange={(v) => { setTts(v); persist({ text_to_speech: v }, 'Text-to-speech updated'); }}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>
        </View>

        {/* Language */}
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>App language</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, language === lang && styles.langChipActive]}
                onPress={() => {
                  setLanguage(lang);
                  persist({ language: lang }, `Language: ${lang}`);
                }}
              >
                <Text style={[styles.langChipText, language === lang && styles.langChipTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => { await signOut(); navigation.replace('Auth'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.dashBg },
  heroBanner: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  heroEyebrow: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { ...typography.h3, color: colors.white, flex: 1, lineHeight: 26, marginRight: 12 },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  toast: {
    backgroundColor: '#27AE60', paddingVertical: 10,
    paddingHorizontal: 20, alignItems: 'center',
  },
  toastText: { ...typography.label, color: colors.white },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  loader: { marginBottom: 12 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center', marginBottom: 12 },
  sectionTitle: { ...typography.h3, color: colors.textDark, marginBottom: 10 },

  card: {
    backgroundColor: colors.white, borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 24, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  rowLabel: { ...typography.body, color: colors.textDark },
  divider: { height: 1, backgroundColor: colors.inputBorder },

  segmented: {
    flexDirection: 'row', borderWidth: 1.5,
    borderColor: colors.inputBorder, borderRadius: 20, overflow: 'hidden',
  },
  segBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  segBtnActive: { backgroundColor: '#1B2A4A' },
  segBtnText: { ...typography.label, color: colors.textMid },
  segBtnTextActive: { color: colors.white },

  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  langChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: colors.inputBorder, backgroundColor: colors.dashBg,
  },
  langChipActive: { backgroundColor: '#1B2A4A', borderColor: '#1B2A4A' },
  langChipText: { ...typography.label, color: colors.textMid },
  langChipTextActive: { color: colors.white },

  logoutBtn: {
    backgroundColor: '#C0392B', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 8,
  },
  logoutText: { ...typography.button, color: colors.white },
});
