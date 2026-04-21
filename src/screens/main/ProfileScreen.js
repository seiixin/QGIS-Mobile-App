import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ visible, title, fields, onSave, onClose, saving, error }) {
  const theme = useTheme();
  const t = useTypography();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary, fontSize: t.h3.fontSize }]}>{title}</Text>

          {fields.map((field) => (
            <View key={field.key} style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>
                {field.label}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary, fontSize: t.body.fontSize }]}
                value={field.value}
                onChangeText={field.onChange}
                placeholder={field.placeholder}
                placeholderTextColor={theme.textMuted}
                secureTextEntry={field.secure}
                autoCapitalize="none"
              />
            </View>
          ))}

          {error ? <Text style={[styles.modalError, { fontSize: t.bodySmall.fontSize }]}>{error}</Text> : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.modalBtnText, { color: theme.textSecondary, fontSize: t.label.fontSize }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={onSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.modalBtnText, { color: '#fff', fontSize: t.label.fontSize }]}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, settings, updateUser } = useAuth();
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();

  // Name modal
  const [nameModal,    setNameModal]    = useState(false);
  const [newName,      setNewName]      = useState('');
  const [savingName,   setSavingName]   = useState(false);
  const [nameError,    setNameError]    = useState('');

  const readiness = [
    settings.language ? 25 : 0,
    user?.email ? 25 : 0,
    settings.text_to_speech ? 25 : 0,
    settings.font_size ? 25 : 0,
  ].reduce((sum, v) => sum + v, 0);

  // ── Save name ───────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!newName.trim()) { setNameError('Name cannot be empty.'); return; }
    try {
      setSavingName(true);
      setNameError('');
      await updateUser({ name: newName.trim() });
      setNameModal(false);
      setNewName('');
    } catch (e) {
      setNameError(e.message);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.scroll}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={[styles.avatarIcon, { fontSize: t.h1.fontSize }]}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { fontSize: t.h2.fontSize }]}>{user?.name || 'SmartQuake User'}</Text>
          <Text style={[styles.profileRole, { fontSize: t.body.fontSize }]}>{tr('Role:')} {user?.role || 'user'}</Text>
          <View style={styles.locationBadge}>
            <Text style={[styles.locationText, { fontSize: t.bodySmall.fontSize }]}>
              {tr('Language:')} {settings.language || 'English'}
            </Text>
          </View>
        </View>

        {/* Account overview */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: t.h3.fontSize }]}>{tr('Account overview')}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted, fontSize: t.bodySmall.fontSize }]}>{tr('Email')}</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>{user?.email || '—'}</Text>
            </View>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted, fontSize: t.bodySmall.fontSize }]}>{tr('Username')}</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>{user?.username || '—'}</Text>
            </View>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted, fontSize: t.bodySmall.fontSize }]}>Display Name</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>{user?.name || '—'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: theme.border }]}
              onPress={() => { setNewName(user?.name || ''); setNameError(''); setNameModal(true); }}
            >
              <Text style={[styles.editBtnText, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preparedness */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: t.h3.fontSize }]}>{tr('Preparedness status')}</Text>
        <View style={styles.readinessCard}>
          <Text style={[styles.readinessLabel, { fontSize: t.label.fontSize }]}>{tr('Readiness score')}</Text>
          <Text style={[styles.readinessScore, { fontSize: t.h1.fontSize }]}>{readiness}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${readiness}%` }]} />
          </View>
          <Text style={[styles.readinessNote, { fontSize: t.body.fontSize }]}>
            {tr('Based on account and accessibility settings synced from the backend.')}
          </Text>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={[styles.settingsBtnText, { fontSize: t.button.fontSize }]}>{tr('Open Settings')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <EditModal
        visible={nameModal}
        title="Edit Display Name"
        fields={[{ key: 'name', label: 'New name', value: newName, onChange: setNewName, placeholder: 'Enter your name', secure: false }]}
        onSave={handleSaveName}
        onClose={() => setNameModal(false)}
        saving={savingName}
        error={nameError}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  profileCard: { backgroundColor: '#1B2A4A', borderRadius: 20, padding: 20, alignItems: 'flex-start', marginBottom: 24 },
  avatarBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarIcon: { color: colors.white, fontWeight: '700' },
  profileName: { ...typography.h2, color: colors.white, marginBottom: 4 },
  profileRole: { ...typography.body, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  locationBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  locationText: { ...typography.bodySmall, color: colors.white },

  sectionTitle: { ...typography.h3, marginBottom: 10 },
  infoCard: { borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  infoDivider: { height: 1 },
  infoLabel: { ...typography.bodySmall, marginBottom: 3 },
  infoValue: { ...typography.h4 },

  editBtn: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  editBtnText: { ...typography.bodySmall, fontWeight: '600' },

  readinessCard: { backgroundColor: '#1B2A4A', borderRadius: 16, padding: 18, marginBottom: 24 },
  readinessLabel: { ...typography.label, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  readinessScore: { ...typography.h1, color: colors.white, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: colors.tabActive, borderRadius: 3 },
  readinessNote: { ...typography.body, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },

  settingsBtn: { backgroundColor: colors.btnPrimary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  settingsBtnText: { ...typography.button, color: colors.white },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    elevation: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  modalTitle: { ...typography.h3, marginBottom: 20, fontWeight: '700' },
  modalField: { marginBottom: 16 },
  modalLabel: { ...typography.bodySmall, marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    ...typography.body,
  },
  modalError: { color: colors.danger, marginBottom: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  modalBtnCancel: { borderWidth: 1.5 },
  modalBtnSave: { backgroundColor: '#1B2A4A' },
  modalBtnText: { fontWeight: '700' },
});
