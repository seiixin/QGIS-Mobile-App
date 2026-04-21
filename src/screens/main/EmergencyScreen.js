import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, ActivityIndicator, Linking, Alert, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/apiClient';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';

const NAV_COLOR = '#1B2A4A';

function callNumber(number) {
  const cleaned = number.replace(/[\s\-().]/g, '');
  const url = `tel:${cleaned}`;
  Linking.canOpenURL(url)
    .then(s => s ? Linking.openURL(url) : Alert.alert('Cannot place call', `Dial ${number} manually.`))
    .catch(() => Alert.alert('Cannot place call', `Dial ${number} manually.`));
}

// ── Animated sliding tab ──────────────────────────────────────────────────────
function TabBar({ activeTab, onSwitch }) {
  const t = useTypography();
  const { t: tr } = useTranslation();
  const anim = useRef(new Animated.Value(activeTab === 'hotlines' ? 0 : 1)).current;

  const switchTo = (tab) => {
    Animated.spring(anim, { toValue: tab === 'hotlines' ? 0 : 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
    onSwitch(tab);
  };

  const indicatorLeft = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  return (
    <View style={styles.tabContainer}>
      <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
      <TouchableOpacity style={styles.tabBtn} onPress={() => switchTo('hotlines')} activeOpacity={0.8}>
        <Text style={[styles.tabBtnText, { fontSize: t.label.fontSize }, activeTab === 'hotlines' && styles.tabBtnTextActive]}>
          {tr('☎  Hotlines')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabBtn} onPress={() => switchTo('contacts')} activeOpacity={0.8}>
        <Text style={[styles.tabBtnText, { fontSize: t.label.fontSize }, activeTab === 'contacts' && styles.tabBtnTextActive]}>
          {tr('✦  My Contacts')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Animated card entrance ────────────────────────────────────────────────────
function AnimatedCard({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 280, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

export default function EmergencyScreen({ navigation }) {
  const { token } = useAuth();
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();
  const [activeTab, setActiveTab]     = useState('hotlines');
  const [hotlines, setHotlines]       = useState([]);
  const [contacts, setContacts]       = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName]         = useState('');
  const [newPhone, setNewPhone]       = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const contentFade                   = useRef(new Animated.Value(1)).current;

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [hotlineData, contactData] = await Promise.all([
        apiRequest('/emergency/hotlines', { token }).catch(e => e.status === 404 ? [] : Promise.reject(e)),
        apiRequest('/emergency/contacts', { token }),
      ]);
      setHotlines(hotlineData);
      setContacts(contactData);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { loadContacts(); }, [loadContacts]));

  const switchTab = (tab) => {
    Animated.timing(contentFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) { setError('Name and phone number are required.'); return; }
    try {
      setSaving(true); setError('');
      const saved = await apiRequest('/emergency/contacts', {
        method: 'POST', token,
        body: { name: newName.trim(), phone: newPhone.trim(), relationship: newRelation.trim() },
      });
      setContacts(c => [...c, saved.data ?? saved]);
      setNewName(''); setNewPhone(''); setNewRelation(''); setShowAddForm(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const removeContact = (id) => {
    Alert.alert(tr('Remove contact'), tr('Are you sure?'), [
      { text: tr('Cancel'), style: 'cancel' },
      { text: tr('Remove'), style: 'destructive', onPress: async () => {
        try {
          await apiRequest(`/emergency/contacts/${id}`, { method: 'DELETE', token });
          setContacts(c => c.filter(i => i.id !== id));
        } catch (e) { setError(e.message); }
      }},
    ]);
  };

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />

      {/* Animated sliding tab */}
      <View style={styles.tabWrapper}>
        <TabBar activeTab={activeTab} onSwitch={switchTab} />
      </View>

      <Animated.View style={{ flex: 1, opacity: contentFade }}>
        <ScrollView style={[styles.bg, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scroll}>
          {loading && <ActivityIndicator color={colors.btnPrimary} style={styles.loader} />}
          {!loading && error ? <Text style={[styles.errorText, { fontSize: t.bodySmall.fontSize }]}>{error}</Text> : null}

          {activeTab === 'hotlines' ? (
            <>
              <Text style={[styles.sectionNote, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>{tr('Official emergency hotlines for Pampanga and national agencies.')}</Text>
              {!loading && hotlines.length === 0 && <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{tr('No official hotlines available yet.')}</Text>}
              {hotlines.map((item, i) => (
                <AnimatedCard key={item.id} delay={i * 60} style={[styles.hotlineCard, { backgroundColor: theme.card }]}>
                  <View style={styles.hotlineIconBox}>
                    <Text style={styles.hotlineEmoji}>☎</Text>
                  </View>
                  <View style={styles.hotlineInfo}>
                    <Text style={[styles.hotlineName, { color: theme.textPrimary, fontSize: t.label.fontSize }]}>{item.agency_name}</Text>
                    <Text style={[styles.hotlineNumber, { fontSize: t.body.fontSize }]}>{item.phone_number}</Text>
                    {item.description ? <Text style={[styles.hotlineDesc, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>{item.description}</Text> : null}
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => callNumber(item.phone_number)}>
                    <Text style={[styles.callBtnText, { fontSize: t.bodySmall.fontSize }]}>{tr('Call')}</Text>
                  </TouchableOpacity>
                </AnimatedCard>
              ))}
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(v => !v)}>
                <Text style={[styles.addBtnText, { fontSize: t.label.fontSize }]}>{showAddForm ? tr('✕  Cancel') : tr('+  Add Contact')}</Text>
              </TouchableOpacity>
              {showAddForm && (
                <AnimatedCard delay={0} style={[styles.addForm, { backgroundColor: theme.card }]}>
                  <TextInput style={[styles.formInput, { borderBottomColor: theme.border, color: theme.textPrimary }]} placeholder="Full Name" placeholderTextColor={theme.textMuted} value={newName} onChangeText={setNewName} />
                  <TextInput style={[styles.formInput, { borderBottomColor: theme.border, color: theme.textPrimary }]} placeholder="Phone Number" placeholderTextColor={theme.textMuted} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                  <TextInput style={[styles.formInput, { borderBottomColor: theme.border, color: theme.textPrimary }]} placeholder="Relationship (optional)" placeholderTextColor={theme.textMuted} value={newRelation} onChangeText={setNewRelation} />
                  <TouchableOpacity style={styles.saveBtn} onPress={addContact} disabled={saving}>
                    {saving ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.saveBtnText, { fontSize: t.label.fontSize }]}>{tr('Save Contact')}</Text>}
                  </TouchableOpacity>
                </AnimatedCard>
              )}
              {!loading && contacts.length === 0 && <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{tr('No personal contacts added yet.')}</Text>}
              {contacts.map((item, i) => (
                <AnimatedCard key={item.id} delay={i * 60} style={[styles.contactCard, { backgroundColor: theme.card }]}>
                  <View style={styles.contactAvatar}>
                    <Text style={[styles.contactAvatarText, { fontSize: t.h4.fontSize }]}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.textPrimary, fontSize: t.label.fontSize }]}>{item.name}</Text>
                    <Text style={[styles.contactPhone, { color: theme.textSecondary, fontSize: t.body.fontSize }]}>{item.phone}</Text>
                    {item.relationship ? <Text style={[styles.contactRelation, { color: theme.textMuted, fontSize: t.bodySmall.fontSize }]}>{item.relationship}</Text> : null}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.callBtn} onPress={() => callNumber(item.phone)}>
                      <Text style={[styles.callBtnText, { fontSize: t.bodySmall.fontSize }]}>{tr('Call')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeContact(item.id)}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedCard>
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  tabWrapper: { backgroundColor: NAV_COLOR, paddingHorizontal: 16, paddingBottom: 14 },
  tabContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, overflow: 'hidden', height: 44, position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', top: 0, bottom: 0, width: '50%',
    backgroundColor: colors.white, borderRadius: 14,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabBtnText: { ...typography.label, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  tabBtnTextActive: { color: NAV_COLOR, fontWeight: '700' },

  bg: { backgroundColor: colors.dashBg },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  loader: { marginBottom: 12 },
  sectionNote: { ...typography.bodySmall, color: colors.textMid, marginBottom: 12, lineHeight: 18 },
  emptyText: { ...typography.body, color: colors.textMid, textAlign: 'center', marginTop: 20 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center', marginBottom: 10 },

  hotlineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14,
    padding: 14, marginBottom: 10, elevation: 1,
  },
  hotlineIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${NAV_COLOR}15`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  hotlineEmoji: { fontSize: 18, color: NAV_COLOR },
  hotlineInfo: { flex: 1 },
  hotlineName: { ...typography.label, color: colors.textDark },
  hotlineNumber: { ...typography.body, color: NAV_COLOR, marginTop: 2 },
  hotlineDesc: { ...typography.bodySmall, color: colors.textMid, marginTop: 4 },
  callBtn: {
    backgroundColor: NAV_COLOR, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  callBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },

  addBtn: {
    backgroundColor: NAV_COLOR, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginBottom: 14,
  },
  addBtnText: { ...typography.label, color: colors.white, fontWeight: '700' },
  addForm: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 14, elevation: 2,
  },
  formInput: {
    borderBottomWidth: 1, borderBottomColor: colors.inputBorder,
    paddingVertical: 10, ...typography.body, color: colors.textDark, marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: colors.success, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { ...typography.label, color: colors.white, fontWeight: '700' },

  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14,
    padding: 14, marginBottom: 10, elevation: 1,
  },
  contactAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: `${NAV_COLOR}20`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  contactAvatarText: { ...typography.h4, color: NAV_COLOR },
  contactInfo: { flex: 1 },
  contactName: { ...typography.label, color: colors.textDark },
  contactPhone: { ...typography.body, color: colors.textMid, marginTop: 2 },
  contactRelation: { ...typography.bodySmall, color: colors.textLight, marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
