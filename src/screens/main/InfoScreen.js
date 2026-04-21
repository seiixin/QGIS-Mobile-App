import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/apiClient';
import { logActivity } from '../../lib/activityStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';

const STORAGE_KEY_PREFIX = 'checklist_progress_';
const PENDING_SYNC_KEY   = 'checklist_pending_sync_';

// ── Section grouping — matches English, Tagalog, and Kapampangan titles ───────
const SECTION_DEFS = [
  {
    id: 'basics', title: 'Basic Information', emoji: 'ℹ️',
    match: t => /what is|causes|sanhi|ano ang|nanu ing|uzung sanhi/i.test(t),
  },
  {
    id: 'faults', title: 'Major Faults in Pampanga', emoji: '🌋',
    match: t => /fault/i.test(t),
  },
  {
    id: 'history', title: 'History of Major Earthquakes', emoji: '📜',
    match: t => /\d{4}.*earthquake|earthquake.*\d{4}|\d{4}.*lindol|lindol.*\d{4}/i.test(t),
  },
  {
    id: 'safety', title: 'Safety Guidelines', emoji: '🛡️',
    match: t => /safety tips|gabay|kaligtasan/i.test(t),
  },
];

const LANGUAGES = ['English', 'Tagalog', 'Kapampangan'];
// ── Static fallback checklist (used when API returns empty) ──────────────────
const FALLBACK_ITEMS = {
  before: [
    { id: 'b1', phase: 'before', label: 'Prepare emergency kit: water, food, flashlight, batteries, first aid, important documents' },
    { id: 'b2', phase: 'before', label: 'Secure heavy furniture and appliances; inspect gas and electrical connections' },
    { id: 'b3', phase: 'before', label: 'Know safe locations: away from windows, under sturdy tables' },
    { id: 'b4', phase: 'before', label: 'Plan with family — decide on meeting points and emergency contacts' },
    { id: 'b5', phase: 'before', label: "Keep emergency contacts saved on your phone" },
    { id: 'b6', phase: 'before', label: "Keep your phone's alerts turned on" },
    { id: 'b7', phase: 'before', label: 'Practice "Drop, Cover, Hold On"' },
  ],
  after: [
    { id: 'a1', phase: 'after', label: 'Check yourself and others for injuries; administer first aid if necessary' },
    { id: 'a2', phase: 'after', label: 'Watch out for dangers: damaged buildings, gas leaks, broken glass' },
    { id: 'a3', phase: 'after', label: 'Avoid using matches or lighters until certain there are no gas leaks' },
    { id: 'a4', phase: 'after', label: 'Listen to official updates via mobile alerts, TV, or radio' },
    { id: 'a5', phase: 'after', label: 'Prepare for aftershocks by staying in safe zones' },
    { id: 'a6', phase: 'after', label: 'Assist neighbors, especially the elderly, disabled, and children' },
    { id: 'a7', phase: 'after', label: "Don't go home until authorities say it's safe" },
  ],
};



// ── TTS helper ────────────────────────────────────────────────────────────────
const TTS_LANG = { English: 'en-US', Tagalog: 'fil-PH', Kapampangan: 'fil-PH' };

function ListenButton({ text, language, small = false }) {
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();
  const [speaking, setSpeaking] = useState(false);

  const handlePress = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: TTS_LANG[language] || 'en-US',
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.listenBtn,
        small && styles.listenBtnSmall,
        speaking && { backgroundColor: theme.accent },
        !speaking && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(27,42,74,0.08)' },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={[styles.listenIcon, { fontSize: small ? 12 : 14 }]}>
        {speaking ? '⏹' : '🔊'}
      </Text>
      <Text style={[
        styles.listenLabel,
        { fontSize: small ? t.bodySmall.fontSize - 1 : t.bodySmall.fontSize },
        { color: speaking ? '#fff' : theme.textSecondary },
      ]}>
        {speaking ? tr('Stop') : tr('Listen')}
      </Text>
    </TouchableOpacity>
  );
}
function AccordionItem({ section, entranceAnim, language }) {
  const theme = useTheme();
  const t = useTypography();
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim    = useRef(new Animated.Value(0)).current;
  // Keep body mounted so animation plays; control visibility via animated values
  const [bodyMounted, setBodyMounted] = useState(false);

  const toggle = () => {
    const opening = !expanded;
    if (opening) setBodyMounted(true); // mount before animating in
    const toValue = opening ? 1 : 0;
    Animated.parallel([
      Animated.timing(chevronAnim, { toValue, duration: 240, useNativeDriver: false }),
      Animated.spring(bodyAnim,    { toValue, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start(({ finished }) => {
      if (finished && !opening) setBodyMounted(false); // unmount after animating out
    });
    setExpanded(opening);
  };

  const rotate      = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const bodyOpacity = bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const bodySlide   = bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  const cardStyle = entranceAnim ? {
    opacity: entranceAnim,
    transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  } : undefined;

  return (
    <Animated.View style={[styles.accordion, { backgroundColor: theme.card }, cardStyle]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[styles.accordionIconBg, { backgroundColor: theme.bg }]}>
          <Text style={{ fontSize: 14 }}>{section.emoji}</Text>
        </View>
        <Text style={[styles.accordionTitle, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>{section.title}</Text>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate }], color: theme.textMuted }]}>▼</Animated.Text>
      </TouchableOpacity>
      {bodyMounted && (
        <Animated.View style={[styles.accordionBody, { opacity: bodyOpacity, transform: [{ translateY: bodySlide }], borderTopColor: theme.border }]}>
          {section.content.map((item, i) => (
            <View key={i} style={styles.contentItem}>
              <Text style={[styles.contentHeading, { fontSize: t.label.fontSize }]}>{item.heading}</Text>
              <Text style={[styles.contentBody, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{item.body}</Text>
              <ListenButton text={`${item.heading}. ${item.body}`} language={language} />
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── Animated checklist item ───────────────────────────────────────────────────
function CheckItem({ text, checked, onToggle, language }) {
  const theme = useTheme();
  const t = useTypography();
  const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  const handleToggle = () => {
    onToggle();
    if (!checked) {
      scaleAnim.setValue(0);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 80,  useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();
    }
  };

  return (
    <TouchableOpacity style={[styles.checkItem, { borderTopColor: theme.border }]} onPress={handleToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, { borderColor: theme.border }, checked && styles.checkboxChecked]}>
        {checked && (
          <Animated.Text style={[styles.checkmark, { transform: [{ scale: scaleAnim }] }]}>✓</Animated.Text>
        )}
      </View>
      <Text style={[styles.checkText, { color: theme.textPrimary, fontSize: t.body.fontSize }, checked && styles.checkTextDone]}>{text}</Text>
      <ListenButton text={text} language={language} small />
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function InfoScreen({ navigation }) {
  const { token, settings, updateSettings } = useAuth();
  const { isOnline } = useNetworkStatus();
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();
  const [language, setLanguage] = useState(settings.language || 'English');
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [checked,   setChecked]   = useState({});
  const [checkLoading, setCheckLoading] = useState(false);
  const [checklistItems, setChecklistItems] = useState(FALLBACK_ITEMS);
  const [pageSpeaking, setPageSpeaking] = useState(false);

  const tabAnim         = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const cardAnims       = useRef([]);
  const langAnim        = useRef(new Animated.Value(0)).current; // 0=English,1=Tagalog,2=Kapampangan

  // Load checklist items + progress — items from API (fallback to static), progress from backend then AsyncStorage
  const loadChecklist = useCallback(async (lang) => {
    try {
      setCheckLoading(true);
      const storageKey = `${STORAGE_KEY_PREFIX}${token?.split('|')[0] || 'guest'}`;

      const [items, progressRaw] = await Promise.all([
        apiRequest('/checklist-items', { token, query: { language: lang } }).catch(() => []),
        apiRequest('/checklist-progress', { token }).catch(async () => {
          const saved = await AsyncStorage.getItem(storageKey).catch(() => null);
          return saved ? JSON.parse(saved) : {};
        }),
      ]);

      // Assign stable string keys (b1-b7, a1-a7) to API items by position
      const beforeItems = items.filter(i => i.phase === 'before');
      const afterItems  = items.filter(i => i.phase === 'after');

      const mapItems = (arr, prefix) =>
        arr.map((item, idx) => ({ ...item, id: `${prefix}${idx + 1}` }));

      const before = beforeItems.length > 0 ? mapItems(beforeItems, 'b') : FALLBACK_ITEMS.before;
      const after  = afterItems.length  > 0 ? mapItems(afterItems,  'a') : FALLBACK_ITEMS.after;

      setChecklistItems({ before, after });

      // Normalize progress keys — convert numeric keys (101→b1, 201→a1) to string keys
      const KEY_MAP = {
        101: 'b1', 102: 'b2', 103: 'b3', 104: 'b4', 105: 'b5', 106: 'b6', 107: 'b7',
        201: 'a1', 202: 'a2', 203: 'a3', 204: 'a4', 205: 'a5', 206: 'a6', 207: 'a7',
      };
      const normalized = {};
      Object.entries(progressRaw || {}).forEach(([k, v]) => {
        const mapped = KEY_MAP[Number(k)] || k;
        normalized[mapped] = Boolean(v);
      });
      setChecked(normalized);
    } catch {
      // silently fall back
    } finally {
      setCheckLoading(false);
    }
  }, [token]);

  // Load checklist progress from backend on mount
  useEffect(() => {
    (async () => {
      try {
        setCheckLoading(true);
        const data = await apiRequest('/checklist-progress', { token });
        setChecked(data || {});
      } catch {
        // silently fall back to empty state
      } finally {
        setCheckLoading(false);
      }
    })();
  }, [token]);

  // Save progress — always to AsyncStorage, sync to backend if online
  const saveTimerRef = useRef(null);
  const saveProgress = useCallback((nextChecked) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const storageKey  = `${STORAGE_KEY_PREFIX}${token?.split('|')[0] || 'guest'}`;
      const pendingKey  = `${PENDING_SYNC_KEY}${token?.split('|')[0] || 'guest'}`;

      // Always persist locally
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextChecked)).catch(() => {});

      if (isOnline) {
        try {
          await apiRequest('/checklist-progress', { method: 'PUT', token, body: nextChecked });
          // Clear pending flag on successful sync
          await AsyncStorage.removeItem(pendingKey).catch(() => {});
        } catch {
          // Mark as pending sync
          await AsyncStorage.setItem(pendingKey, 'true').catch(() => {});
        }
      } else {
        // Offline — mark as pending sync
        await AsyncStorage.setItem(pendingKey, 'true').catch(() => {});
      }
    }, 400);
  }, [token, isOnline]);

  // When coming back online, sync any pending progress
  useEffect(() => {
    if (!isOnline || !token) return;
    (async () => {
      const pendingKey = `${PENDING_SYNC_KEY}${token?.split('|')[0] || 'guest'}`;
      const storageKey = `${STORAGE_KEY_PREFIX}${token?.split('|')[0] || 'guest'}`;
      const hasPending = await AsyncStorage.getItem(pendingKey).catch(() => null);
      if (!hasPending) return;
      const saved = await AsyncStorage.getItem(storageKey).catch(() => null);
      if (!saved) return;
      try {
        await apiRequest('/checklist-progress', { method: 'PUT', token, body: JSON.parse(saved) });
        await AsyncStorage.removeItem(pendingKey);
      } catch {}
    })();
  }, [isOnline, token]);

  const loadEntries = useCallback(async (lang) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/earthquake-info', { token, query: { language: lang } });
      setEntries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    const lang = settings.language || 'English';
    setLanguage(lang);
    const idx = LANGUAGES.indexOf(lang);
    langAnim.setValue(idx >= 0 ? idx : 0);
    loadEntries(lang);
    loadChecklist(lang);
  }, [loadEntries, loadChecklist, settings.language]));

  const sections = useMemo(() => {
    const grouped = SECTION_DEFS.map(def => ({
      ...def,
      content: entries.filter(e => def.match(e.title)).map(e => ({ heading: e.title, body: e.content })),
    })).filter(s => s.content.length > 0);
    return grouped.length > 0
      ? grouped
      : [{ id: 'all', title: 'Earthquake Information', emoji: '📖', content: entries.map(e => ({ heading: e.title, body: e.content })) }];
  }, [entries]);

  const infoNarrationText = useMemo(() => (
    sections
      .flatMap((section) => [
        section.title,
        ...section.content.map((item) => `${item.heading}. ${item.body}`),
      ])
      .join('. ')
  ), [sections]);

  const checklistNarrationText = useMemo(() => {
    const beforeText = checklistItems.before.map((item) =>
      `${checked[item.id] ? 'Completed' : 'Pending'}. ${item.label}`
    );
    const afterText = checklistItems.after.map((item) =>
      `${checked[item.id] ? 'Completed' : 'Pending'}. ${item.label}`
    );

    return [
      'Before an earthquake checklist.',
      ...beforeText,
      'After an earthquake checklist.',
      ...afterText,
    ].join('. ');
  }, [checklistItems, checked]);

  // Staggered entrance animation when sections load
  useEffect(() => {
    cardAnims.current = sections.map(() => new Animated.Value(0));
    Animated.stagger(80, cardAnims.current.map(a =>
      Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true })
    )).start();
  }, [sections.length]);

  useEffect(() => () => {
    Speech.stop();
  }, []);

  const handleNarration = async (text) => {
    if (!text) return;

    if (pageSpeaking) {
      await Speech.stop();
      setPageSpeaking(false);
      return;
    }

    setPageSpeaking(true);
    Speech.speak(text, {
      language: TTS_LANG[language] || 'en-US',
      rate: 0.9,
      onDone: () => setPageSpeaking(false),
      onStopped: () => setPageSpeaking(false),
      onError: () => setPageSpeaking(false),
    });
  };

  const switchTab = (tab) => {
    if (pageSpeaking) {
      Speech.stop();
      setPageSpeaking(false);
    }
    Animated.timing(contentFadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    Animated.spring(tabAnim, { toValue: tab === 'info' ? 0 : 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
  };

  const handleLanguageChange = async (lang) => {
    const idx = LANGUAGES.indexOf(lang);
    Animated.spring(langAnim, { toValue: idx, useNativeDriver: false, tension: 60, friction: 10 }).start();
    setLanguage(lang);
    await Promise.all([loadEntries(lang), loadChecklist(lang)]);
    try { await updateSettings({ language: lang }); } catch {}
  };

  const indicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  const total = (checklistItems.before.length + checklistItems.after.length) || 14;
  const done  = Object.values(checked).filter(Boolean).length;
  const pct   = Math.round((done / total) * 100);

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />

      <View style={styles.heroBanner}>
        <Text style={[styles.heroEyebrow, { fontSize: t.bodySmall.fontSize }]}>{tr('Earthquake info')}</Text>
        <View style={styles.heroRow}>
          <Text style={[styles.heroTitle, { fontSize: t.h3.fontSize }]}>{tr('Readable guidance with multilingual support')}</Text>
          <TouchableOpacity
            style={[styles.heroIcon, pageSpeaking && styles.heroIconActive]}
            onPress={() => handleNarration(activeTab === 'info' ? infoNarrationText : checklistNarrationText)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>{pageSpeaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.heroVoiceHint, { fontSize: t.bodySmall.fontSize }]}>
          {pageSpeaking ? tr('Stop') : tr('Listen')}
        </Text>
      </View>

      {/* Animated sliding tab */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('info')} activeOpacity={0.8}>
          <Text style={[styles.tabBtnText, { color: theme.textSecondary, fontSize: t.label.fontSize }, activeTab === 'info' && styles.tabBtnTextActive]}>{tr('ℹ️  Info')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('checklist')} activeOpacity={0.8}>
          <Text style={[styles.tabBtnText, { color: theme.textSecondary, fontSize: t.label.fontSize }, activeTab === 'checklist' && styles.tabBtnTextActive]}>{tr('✅  Checklist')}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <ScrollView style={[styles.bg, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scroll}>
            {/* Animated language selector */}
            <View style={[styles.langContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Animated.View style={[styles.langIndicator, {
                left: langAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0%', '33.33%', '66.66%'],
                }),
              }]} />
              {LANGUAGES.map((lang, i) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.langBtn}
                  onPress={() => handleLanguageChange(lang)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langBtnText, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }, language === lang && styles.langBtnTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading && <ActivityIndicator color={colors.btnPrimary} style={styles.loader} />}
            {!loading && error ? <Text style={[styles.statusText, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{error}</Text> : null}
            {!loading && !error && entries.length === 0 && (
              <Text style={[styles.statusText, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{tr('No information available for this language yet.')}</Text>
            )}
            {sections.map((section, i) => (
              <AccordionItem key={section.id} section={section} entranceAnim={cardAnims.current[i]} language={language} />
            ))}
          </ScrollView>
        )}

        {/* ── CHECKLIST TAB ── */}
        {activeTab === 'checklist' && (
          <ScrollView style={[styles.bg, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scroll}>
            <TouchableOpacity
              style={[styles.narrationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleNarration(checklistNarrationText)}
              activeOpacity={0.85}
            >
              <View style={[styles.narrationIcon, { backgroundColor: pageSpeaking ? theme.accent : theme.bg }]}>
                <Text style={styles.narrationIconText}>{pageSpeaking ? '⏹' : '🔊'}</Text>
              </View>
              <View style={styles.narrationContent}>
                <Text style={[styles.narrationTitle, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>
                  Checklist voice support
                </Text>
                <Text style={[styles.narrationBody, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>
                  {pageSpeaking
                    ? 'Stop the current checklist narration.'
                    : 'Read the full checklist aloud in your selected language.'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.checkSection, { backgroundColor: theme.card }]}>
              <View style={[styles.checkSectionHeader, { backgroundColor: '#1B2A4A' }]}>
                <Text style={[styles.checkSectionTitle, { fontSize: t.label.fontSize }]}>{tr('⚠️  To-Do Before an Earthquake')}</Text>
              </View>
              {checkLoading && <ActivityIndicator color={colors.btnPrimary} style={{ margin: 12 }} />}
              {checklistItems.before.map(item => (
                <CheckItem key={item.id} text={item.label}
                  checked={Boolean(checked[item.id])}
                  language={language}
                  onToggle={() => {
                    const next = { ...checked, [item.id]: !checked[item.id] };
                    setChecked(next);
                    saveProgress(next);
                    if (!checked[item.id]) {
                      logActivity({ type: 'checklist', label: 'Checklist item checked', sub: item.label });
                    }
                  }} />
              ))}
            </View>

            <View style={[styles.checkSection, { backgroundColor: theme.card }]}>
              <View style={[styles.checkSectionHeader, { backgroundColor: '#C0392B' }]}>
                <Text style={[styles.checkSectionTitle, { fontSize: t.label.fontSize }]}>{tr('🔴  To-Do After an Earthquake')}</Text>
              </View>
              {checklistItems.after.map(item => (
                <CheckItem key={item.id} text={item.label}
                  checked={Boolean(checked[item.id])}
                  language={language}
                  onToggle={() => {
                    const next = { ...checked, [item.id]: !checked[item.id] };
                    setChecked(next);
                    saveProgress(next);
                    if (!checked[item.id]) {
                      logActivity({ type: 'checklist', label: 'Checklist item checked', sub: item.label });
                    }
                  }} />
              ))}
            </View>

            <View style={styles.progressCard}>
              <Text style={[styles.progressLabel, { fontSize: t.h3.fontSize }]}>Preparedness: {pct}%</Text>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={[styles.progressSub, { fontSize: t.bodySmall.fontSize }]}>{done} {tr('of')} {total} {tr('items completed')}</Text>
            </View>
          </ScrollView>
        )}

      </Animated.View>
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
  heroIconActive: { backgroundColor: '#3B4FE0' },
  heroVoiceHint: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 10,
  },

  tabContainer: {
    flexDirection: 'row', backgroundColor: colors.white,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, overflow: 'hidden', elevation: 2,
    position: 'relative', height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  tabIndicator: {
    position: 'absolute', top: 0, bottom: 0,
    width: '50%', backgroundColor: '#1B2A4A', borderRadius: 14,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabBtnText: { ...typography.label, color: colors.textMid, fontSize: 13 },
  tabBtnTextActive: { color: colors.white, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 32 },

  // Animated language selector
  langContainer: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: 14, overflow: 'hidden',
    marginBottom: 16, height: 40,
    position: 'relative', elevation: 1,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  langIndicator: {
    position: 'absolute', top: 0, bottom: 0,
    width: '33.33%', backgroundColor: colors.btnPrimary,
    borderRadius: 13,
  },
  langBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  langBtnText: { ...typography.bodySmall, color: colors.textMid, fontWeight: '600' },
  langBtnTextActive: { color: colors.white, fontWeight: '700' },
  loader: { marginVertical: 18 },
  statusText: { ...typography.body, color: colors.textMid, textAlign: 'center', marginBottom: 18 },

  accordion: {
    backgroundColor: colors.white, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden', elevation: 1,
  },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  accordionIconBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.dashBg, alignItems: 'center', justifyContent: 'center',
  },
  accordionTitle: { flex: 1, ...typography.h4, color: colors.textDark },
  chevron: { fontSize: 11, color: colors.textLight },
  accordionBody: {
    paddingHorizontal: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: colors.inputBorder,
  },
  contentItem: { marginTop: 12 },
  contentHeading: { ...typography.label, color: colors.textAccent, marginBottom: 4 },
  contentBody: { ...typography.body, color: colors.textMid, lineHeight: 22 },

  listenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  listenBtnSmall: {
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 0, marginLeft: 6,
  },
  listenIcon: { fontSize: 14 },
  listenLabel: { fontWeight: '600' },

  narrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  narrationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  narrationIconText: { fontSize: 16 },
  narrationContent: { flex: 1 },
  narrationTitle: { ...typography.h4, marginBottom: 4 },
  narrationBody: { ...typography.bodySmall, lineHeight: 18 },

  checkSection: {
    backgroundColor: colors.white, borderRadius: 14,
    marginBottom: 16, overflow: 'hidden', elevation: 1,
  },
  checkSectionHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  checkSectionTitle: { ...typography.label, color: colors.white },
  checkItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.inputBorder, gap: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.inputBorder,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '700' },
  checkText: { ...typography.body, color: colors.textDark, flex: 1, lineHeight: 20 },
  checkTextDone: { color: colors.textLight, textDecorationLine: 'line-through' },

  progressCard: {
    backgroundColor: '#1B2A4A', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  progressLabel: { ...typography.h3, color: colors.white, marginBottom: 10 },
  progressBar: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8,
  },
  progressFill: { height: 8, backgroundColor: '#27AE60', borderRadius: 4 },
  progressSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)' },
});
