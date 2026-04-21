import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, StatusBar, ActivityIndicator, Animated,
  Modal, TextInput,
} from 'react-native';
import * as Speech from 'expo-speech';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';

const FONT_MAP = { S: 'small', M: 'medium', L: 'large' };
const LANGUAGES = ['English', 'Tagalog', 'Kapampangan'];
const TTS_LANG  = { English: 'en-US', Tagalog: 'fil-PH', Kapampangan: 'fil-PH' };

const FONT_PREVIEW = { S: 13, M: 16, L: 20 };

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, updatePassword, signOut } = useAuth();
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();

  const [darkMode,     setDarkMode]     = useState(Boolean(settings.dark_mode));
  const [highContrast, setHighContrast] = useState(theme.highContrast);
  const [tts,          setTts]          = useState(Boolean(settings.text_to_speech));
  const [fontSize,     setFontSize]     = useState(settings.fontSizeLabel || 'M');
  const [language,     setLanguage]     = useState(settings.language || 'English');
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState('');
  const [error,        setError]        = useState('');

  // Change password modal state
  const [pwModal,    setPwModal]    = useState(false);
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [savingPw,   setSavingPw]   = useState(false);
  const [pwError,    setPwError]    = useState('');

  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDarkMode(Boolean(settings.dark_mode));
    setHighContrast(theme.highContrast);
    setTts(Boolean(settings.text_to_speech));
    setFontSize(settings.fontSizeLabel || 'M');
    setLanguage(settings.language || 'English');
  }, [settings, theme.highContrast]);

  const showToast = (msg) => {
    setToast(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(''));
  };

  const persist = async (partial, label) => {
    try {
      setSaving(true);
      setError('');
      await updateSettings(partial);
      if (label) showToast(label);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // TTS preview — speaks a sample sentence when toggled on
  const handleTtsToggle = (v) => {
    setTts(v);
    persist({ text_to_speech: v }, v ? 'Text-to-speech enabled' : 'Text-to-speech disabled');
    if (v) {
      const lang = settings.language || 'English';
      const sample = lang === 'Tagalog'
        ? 'Ang text-to-speech ay naka-on na.'
        : lang === 'Kapampangan'
        ? 'Ing text-to-speech naka-on na.'
        : 'Text-to-speech is now enabled.';
      Speech.speak(sample, { language: TTS_LANG[lang] || 'en-US', rate: 0.9 });
    } else {
      Speech.stop();
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    try {
      setSavingPw(true);
      setPwError('');
      await updatePassword({ current_password: currentPw, password: newPw, password_confirmation: confirmPw });
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully');
    } catch (e) {
      setPwError(e.message);
    } finally {
      setSavingPw(false);
    }
  };

  // Dynamic styles based on theme
  const bg        = theme.bg;
  const cardBg    = theme.card;
  const textColor = theme.textPrimary;
  const subColor  = theme.textSecondary;
  const borderCol = theme.border;
  const navBg     = theme.navBg;
  const fSize     = FONT_PREVIEW[fontSize] || 16;

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor={navBg} />

      {/* Hero */}
      <View style={[styles.heroBanner, { backgroundColor: navBg }]}>
        <Text style={[styles.heroEyebrow, { fontSize: t.bodySmall.fontSize }]}>{tr('Settings')}</Text>
        <View style={styles.heroRow}>
          <Text style={[styles.heroTitle, { fontSize: t.h3.fontSize }]}>{tr('Appearance, accessibility, and account preferences')}</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 20 }}>⚙️</Text></View>
        </View>
      </View>

      {/* Animated toast */}
      {toast ? (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
          <Text style={[styles.toastText, { fontSize: t.label.fontSize }]}>✓  {toast}</Text>
        </Animated.View>
      ) : null}

      <ScrollView style={[styles.bg, { backgroundColor: bg }]} contentContainerStyle={styles.scroll}>
        {saving && <ActivityIndicator color={theme.accent} style={styles.loader} />}
        {error ? <Text style={[styles.errorText, { color: theme.danger, fontSize: t.bodySmall.fontSize }]}>{error}</Text> : null}

        {/* ── Appearance ── */}
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: t.h3.fontSize }]}>{tr('Appearance')}</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>

          {/* Dark mode */}
          <View style={styles.row}>
            <View>
              <Text style={[styles.rowLabel, { color: textColor, fontSize: t.h4.fontSize }]}>{tr('Dark mode')}</Text>
              <Text style={[styles.rowHint, { color: subColor, fontSize: t.bodySmall.fontSize }]}>{tr('Changes app background and text colors')}</Text>
            </View>
            <Switch value={darkMode}
              onValueChange={(v) => { setDarkMode(v); persist({ dark_mode: v }, v ? 'Dark mode on' : 'Dark mode off'); }}
              trackColor={{ false: borderCol, true: navBg }}
              thumbColor={cardBg} />
          </View>

          <View style={[styles.divider, { backgroundColor: borderCol }]} />

          {/* Font size */}
          <View style={styles.row}>
            <View>
              <Text style={[styles.rowLabel, { color: textColor, fontSize: t.h4.fontSize }]}>{tr('Font size')}</Text>
              <Text style={[styles.rowHint, { color: subColor, fontSize: t.bodySmall.fontSize }]}>
                Preview: {fSize === 13 ? 'Small' : fSize === 16 ? 'Medium' : 'Large'} text
              </Text>
            </View>
            <View style={[styles.segmented, { borderColor: borderCol }]}>
              {['S', 'M', 'L'].map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.segBtn, fontSize === s && { backgroundColor: navBg }]}
                  onPress={() => { setFontSize(s); persist({ font_size: FONT_MAP[s] }, `Font size: ${s === 'S' ? 'Small' : s === 'M' ? 'Medium' : 'Large'}`); }}>
                  <Text style={[styles.segBtnText, { color: fontSize === s ? cardBg : subColor, fontSize: t.label.fontSize }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: borderCol }]} />

          {/* High contrast */}
          <View style={styles.row}>
            <View>
              <Text style={[styles.rowLabel, { color: textColor, fontSize: t.h4.fontSize }]}>{tr('High contrast')}</Text>
              <Text style={[styles.rowHint, { color: subColor, fontSize: t.bodySmall.fontSize }]}>{tr('Increases text and border contrast')}</Text>
            </View>
            <Switch value={highContrast}
              onValueChange={(v) => {
                setHighContrast(v);
                theme.setHighContrast(v);
                showToast(v ? 'High contrast on' : 'High contrast off');
              }}
              trackColor={{ false: borderCol, true: navBg }}
              thumbColor={cardBg} />
          </View>
        </View>

        {/* ── Accessibility ── */}
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: t.h3.fontSize }]}>{tr('Accessibility')}</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.rowLabel, { color: textColor, fontSize: t.h4.fontSize }]}>{tr('Text-to-speech')}</Text>
              <Text style={[styles.rowHint, { color: subColor, fontSize: t.bodySmall.fontSize }]}>
                {tts ? tr('Active — reads content aloud in your language') : tr('Tap to enable voice reading')}
              </Text>
            </View>
            <Switch value={tts}
              onValueChange={handleTtsToggle}
              trackColor={{ false: borderCol, true: navBg }}
              thumbColor={cardBg} />
          </View>
          {tts && (
            <TouchableOpacity
              style={[styles.ttsTestBtn, { borderColor: navBg }]}
              onPress={() => {
                const lang = settings.language || 'English';
                Speech.speak(
                  lang === 'Tagalog' ? 'Ito ay isang pagsubok ng text-to-speech.'
                  : lang === 'Kapampangan' ? 'Iti metung a test ning text-to-speech.'
                  : 'This is a text-to-speech test.',
                  { language: TTS_LANG[lang] || 'en-US', rate: 0.9 }
                );
              }}
            >
              <Text style={[styles.ttsTestText, { color: navBg, fontSize: t.label.fontSize }]}>{tr('▶  Test voice')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Language ── */}
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: t.h3.fontSize }]}>{tr('Language')}</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.rowLabel, { color: textColor, paddingTop: 14, fontSize: t.h4.fontSize }]}>{tr('App language')}</Text>
          <Text style={[styles.rowHint, { color: subColor, marginBottom: 12, fontSize: t.bodySmall.fontSize }]}>
            {tr('Affects earthquake info, checklist, and voice output')}
          </Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, { borderColor: borderCol, backgroundColor: bg },
                  language === lang && { backgroundColor: navBg, borderColor: navBg }]}
                onPress={() => {
                  setLanguage(lang);
                  persist({ language: lang }, `Language: ${lang}`);
                  if (tts) {
                    Speech.speak(
                      lang === 'Tagalog' ? 'Tagalog ang napiling wika.'
                      : lang === 'Kapampangan' ? 'Kapampangan ing pinili mung amanu.'
                      : 'English is now selected.',
                      { language: TTS_LANG[lang] || 'en-US', rate: 0.9 }
                    );
                  }
                }}
              >
                <Text style={[styles.langChipText, { color: language === lang ? cardBg : subColor, fontSize: t.label.fontSize }]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Security ── */}
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: t.h3.fontSize }]}>Security</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); setPwModal(true); }}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.rowLabel, { color: textColor, fontSize: t.h4.fontSize }]}>Change Password</Text>
              <Text style={[styles.rowHint, { color: subColor, fontSize: t.bodySmall.fontSize }]}>Update your account password</Text>
            </View>
            <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account ── */}
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: t.h3.fontSize }]}>{tr('Account')}</Text>
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.danger }]}
          onPress={async () => { await signOut(); navigation.replace('Auth'); }}
          activeOpacity={0.85}
        >
          <Text style={[styles.logoutText, { fontSize: t.button.fontSize }]}>{tr('🚪  Log Out')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor, fontSize: t.h3.fontSize }]}>Change Password</Text>

            <Text style={[styles.modalLabel, { color: subColor, fontSize: t.bodySmall.fontSize }]}>Current password</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: borderCol, color: textColor, fontSize: t.body.fontSize }]}
              value={currentPw} onChangeText={setCurrentPw}
              placeholder="••••••••" placeholderTextColor={theme.textMuted}
              secureTextEntry autoCapitalize="none"
            />

            <Text style={[styles.modalLabel, { color: subColor, fontSize: t.bodySmall.fontSize, marginTop: 12 }]}>New password</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: borderCol, color: textColor, fontSize: t.body.fontSize }]}
              value={newPw} onChangeText={setNewPw}
              placeholder="Min. 8 characters" placeholderTextColor={theme.textMuted}
              secureTextEntry autoCapitalize="none"
            />

            <Text style={[styles.modalLabel, { color: subColor, fontSize: t.bodySmall.fontSize, marginTop: 12 }]}>Confirm new password</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: borderCol, color: textColor, fontSize: t.body.fontSize }]}
              value={confirmPw} onChangeText={setConfirmPw}
              placeholder="Re-enter new password" placeholderTextColor={theme.textMuted}
              secureTextEntry autoCapitalize="none"
            />

            {pwError ? <Text style={[styles.modalError, { fontSize: t.bodySmall.fontSize }]}>{pwError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: borderCol }]}
                onPress={() => setPwModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: subColor, fontSize: t.label.fontSize }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: navBg }]}
                onPress={handleChangePassword}
                disabled={savingPw}
              >
                {savingPw
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[styles.modalBtnText, { color: '#fff', fontSize: t.label.fontSize }]}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  heroBanner: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  heroEyebrow: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, lineHeight: 26, marginRight: 12 },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  toast: {
    paddingVertical: 10, paddingHorizontal: 20,
    alignItems: 'center', backgroundColor: '#27AE60',
  },
  toastText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  loader: { marginBottom: 12 },
  errorText: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },

  card: {
    borderRadius: 16, paddingHorizontal: 16,
    marginBottom: 24, elevation: 1,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowHint: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },

  segmented: {
    flexDirection: 'row', borderWidth: 1.5,
    borderRadius: 20, overflow: 'hidden',
  },
  segBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  segBtnText: { fontSize: 13, fontWeight: '600' },

  ttsTestBtn: {
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
    marginBottom: 14,
  },
  ttsTestText: { fontSize: 13, fontWeight: '700' },

  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  langChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  langChipText: { fontSize: 13, fontWeight: '600' },

  logoutBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    elevation: 12,
  },
  modalTitle: { fontWeight: '700', marginBottom: 20 },
  modalLabel: { marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  modalError: { color: '#E74C3C', marginTop: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnCancel: { borderWidth: 1.5 },
  modalBtnSave: {},
  modalBtnText: { fontWeight: '700' },
});
