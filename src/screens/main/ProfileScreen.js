import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function ProfileScreen({ navigation }) {
  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.profileName}>Maria Santos</Text>
          <Text style={styles.profileRole}>Preparedness coordinator</Text>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>📍 Apalit, Pampanga</Text>
          </View>
        </View>

        {/* Account overview */}
        <Text style={styles.sectionTitle}>Account overview</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>maria.santos@smartquake.app</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency role</Text>
            <Text style={styles.infoValue}>Barangay response lead</Text>
          </View>
        </View>

        {/* Preparedness status */}
        <Text style={styles.sectionTitle}>Preparedness status</Text>
        <View style={styles.readinessCard}>
          <Text style={styles.readinessLabel}>Readiness score</Text>
          <Text style={styles.readinessScore}>84%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '84%' }]} />
          </View>
          <Text style={styles.readinessNote}>
            Emergency contacts, go-bag plan, and offline maps are already set up.
          </Text>
        </View>

        {/* Edit profile button */}
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.dashBg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  profileCard: {
    backgroundColor: '#1B2A4A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatarBox: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarIcon: { fontSize: 28 },
  profileName: { ...typography.h2, color: colors.white, marginBottom: 4 },
  profileRole: { ...typography.body, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  locationBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  locationText: { ...typography.bodySmall, color: colors.white },

  sectionTitle: { ...typography.h3, color: colors.textDark, marginBottom: 10 },

  infoCard: {
    backgroundColor: colors.white, borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 24,
    elevation: 1,
  },
  infoRow: { paddingVertical: 14 },
  infoDivider: { height: 1, backgroundColor: colors.inputBorder },
  infoLabel: { ...typography.bodySmall, color: colors.textLight, marginBottom: 4 },
  infoValue: { ...typography.h4, color: colors.textDark },

  readinessCard: {
    backgroundColor: '#1B2A4A',
    borderRadius: 16, padding: 18, marginBottom: 24,
  },
  readinessLabel: { ...typography.label, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  readinessScore: { ...typography.h1, color: colors.white, marginBottom: 10 },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, marginBottom: 10,
  },
  progressFill: { height: 6, backgroundColor: colors.tabActive, borderRadius: 3 },
  readinessNote: { ...typography.body, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },

  editBtn: {
    backgroundColor: colors.btnPrimary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  editBtnText: { ...typography.button, color: colors.white },
});
