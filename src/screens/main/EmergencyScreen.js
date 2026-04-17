import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const hotlines = [
  { name: 'NDRRMC', number: '(02) 8911-1406', icon: '🏛️' },
  { name: 'BFP (Fire)', number: '160', icon: '🚒' },
  { name: 'PNP (Police)', number: '117', icon: '👮' },
  { name: 'Red Cross', number: '143', icon: '🏥' },
  { name: 'PHIVOLCS', number: '(02) 8426-1468', icon: '🌋' },
  { name: 'Apalit MDRRMO', number: '(045) 436-0001', icon: '🏠' },
];

const personalContacts = [
  { name: 'Maria Santos', phone: '+63 912 345 6789', relationship: 'Mother' },
  { name: 'Juan Dela Cruz', phone: '+63 917 654 3210', relationship: 'Father' },
];

export default function EmergencyScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('hotlines');
  const [contacts, setContacts] = useState(personalContacts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  const addContact = () => {
    if (newName && newPhone) {
      setContacts([...contacts, { name: newName, phone: newPhone, relationship: newRelation }]);
      setNewName(''); setNewPhone(''); setNewRelation('');
      setShowAddForm(false);
    }
  };

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Tab row */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hotlines' && styles.tabActive]}
          onPress={() => setActiveTab('hotlines')}
        >
          <Text style={[styles.tabText, activeTab === 'hotlines' && styles.tabTextActive]}>📞 Hotlines</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && styles.tabActive]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab === 'contacts' && styles.tabTextActive]}>👤 My Contacts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {activeTab === 'hotlines' ? (
          <>
            <Text style={styles.sectionNote}>Official emergency hotlines for Pampanga and national agencies.</Text>
            {hotlines.map((item, i) => (
              <View key={i} style={styles.hotlineCard}>
                <Text style={styles.hotlineIcon}>{item.icon}</Text>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineName}>{item.name}</Text>
                  <Text style={styles.hotlineNumber}>{item.number}</Text>
                </View>
                <TouchableOpacity style={styles.callBtn}><Text style={styles.callBtnText}>Call</Text></TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(!showAddForm)}>
              <Text style={styles.addBtnText}>+ Add Contact</Text>
            </TouchableOpacity>
            {showAddForm && (
              <View style={styles.addForm}>
                <TextInput style={styles.formInput} placeholder="Full Name" placeholderTextColor={colors.textLight} value={newName} onChangeText={setNewName} />
                <TextInput style={styles.formInput} placeholder="Phone Number" placeholderTextColor={colors.textLight} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                <TextInput style={styles.formInput} placeholder="Relationship (optional)" placeholderTextColor={colors.textLight} value={newRelation} onChangeText={setNewRelation} />
                <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
                  <Text style={styles.saveBtnText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            )}
            {contacts.map((item, i) => (
              <View key={i} style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                  {item.relationship ? <Text style={styles.contactRelation}>{item.relationship}</Text> : null}
                </View>
                <TouchableOpacity style={styles.callBtn}><Text style={styles.callBtnText}>Call</Text></TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { ...typography.label, color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: colors.textDark, fontWeight: '700' },

  bg: { backgroundColor: colors.dashBg },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  sectionNote: { ...typography.bodySmall, color: colors.textMid, marginBottom: 12, lineHeight: 18 },

  hotlineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14,
    padding: 14, marginBottom: 10, elevation: 1,
  },
  hotlineIcon: { fontSize: 24, marginRight: 12 },
  hotlineInfo: { flex: 1 },
  hotlineName: { ...typography.label, color: colors.textDark },
  hotlineNumber: { ...typography.body, color: colors.textAccent, marginTop: 2 },
  callBtn: {
    backgroundColor: colors.btnPrimary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  callBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },

  addBtn: {
    backgroundColor: colors.btnPrimary, borderRadius: 12,
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
    backgroundColor: colors.btnPrimary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  contactAvatarText: { ...typography.h4, color: colors.btnPrimary },
  contactInfo: { flex: 1 },
  contactName: { ...typography.label, color: colors.textDark },
  contactPhone: { ...typography.body, color: colors.textMid, marginTop: 2 },
  contactRelation: { ...typography.bodySmall, color: colors.textLight, marginTop: 2 },
});
