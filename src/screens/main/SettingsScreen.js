import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Switch, TouchableOpacity, StatusBar,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function SettingsScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(true);
  const [highContrast, setHighContrast] = useState(true);
  const [tts, setTts] = useState(true);
  const [fontSize, setFontSize] = useState('M');
  const [language, setLanguage] = useState('English');

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Settings</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Adjust appearance, accessibility, and account preferences</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 20 }}>⚙️</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Font size</Text>
            <View style={styles.segmented}>
              {['S', 'M', 'L'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.segBtn, fontSize === s && styles.segBtnActive]}
                  onPress={() => setFontSize(s)}
                >
                  <Text style={[styles.segBtnText, fontSize === s && styles.segBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>High contrast</Text>
            <Switch value={highContrast} onValueChange={setHighContrast}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>
        </View>

        {/* Accessibility */}
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Text-to-speech</Text>
            <Switch value={tts} onValueChange={setTts}
              trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
              thumbColor={colors.white} />
          </View>
        </View>

        {/* Language */}
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App language</Text>
            <View style={styles.langSelector}>
              {['English', 'Tagalog', 'Kapampangan'].map((l) => (
                <TouchableOpacity key={l} onPress={() => setLanguage(l)}>
                  <Text style={[styles.langOption, language === l && styles.langOptionActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.replace('Auth')}
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
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  sectionTitle: { ...typography.h3, color: colors.textDark, marginBottom: 10 },

  settingsCard: {
    backgroundColor: colors.white, borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 24, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  settingLabel: { ...typography.body, color: colors.textDark },
  rowDivider: { height: 1, backgroundColor: colors.inputBorder },

  segmented: {
    flexDirection: 'row',
    borderWidth: 1.5, borderColor: colors.inputBorder,
    borderRadius: 20, overflow: 'hidden',
  },
  segBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  segBtnActive: { backgroundColor: '#1B2A4A' },
  segBtnText: { ...typography.label, color: colors.textMid },
  segBtnTextActive: { color: colors.white },

  langSelector: { flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  langOption: { ...typography.body, color: colors.textMid },
  langOptionActive: { color: colors.btnPrimary, fontWeight: '700' },

  logoutBtn: {
    backgroundColor: '#C0392B', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 8,
  },
  logoutText: { ...typography.button, color: colors.white },
});
