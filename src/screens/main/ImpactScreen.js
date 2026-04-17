import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const impactData = [
  { scenario: 'M7.2 West Valley Fault Rupture', fault: 'West Valley Fault', casualties: '1,240', economicLoss: '2,500,000,000', severity: 'critical' },
  { scenario: 'M6.1 East Zambales Fault', fault: 'East Zambales Fault', casualties: '320', economicLoss: '850,000,000', severity: 'high' },
  { scenario: 'M6.5 Marikina Valley Fault', fault: 'Marikina Valley Fault', casualties: '580', economicLoss: '1,200,000,000', severity: 'high' },
  { scenario: 'M5.9 Apalit Local Fault', fault: 'Local Fault System', casualties: '85', economicLoss: '120,000,000', severity: 'moderate' },
];

const severityColor = { critical: '#EF4444', high: '#F59E0B', moderate: '#3B82F6' };

export default function ImpactScreen({ navigation }) {
  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Impact results</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Compare scenario severity and expected losses</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 22 }}>📊</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {impactData.map((item, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.scenarioName}>{item.scenario}</Text>
            <Text style={styles.faultName}>Fault: {item.fault}</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#FFF0F0' }]}>
                <Text style={styles.statLabel}>Casualties</Text>
                <Text style={styles.statValueRed}>👤 Casualties: {item.casualties}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#EEF4FF' }]}>
                <Text style={styles.statLabel}>Economic loss</Text>
                <Text style={styles.statValueBlue}>💰 Loss: PHP {item.economicLoss}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.dashBg },
  heroBanner: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  heroEyebrow: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { ...typography.h3, color: colors.white, flex: 1, lineHeight: 26, marginRight: 12 },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  scenarioName: { ...typography.h3, color: colors.textDark, marginBottom: 4 },
  faultName: { ...typography.bodySmall, color: colors.textMid, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 10, padding: 12 },
  statLabel: { ...typography.bodySmall, color: colors.textMid, marginBottom: 6 },
  statValueRed: { ...typography.label, color: '#EF4444' },
  statValueBlue: { ...typography.label, color: '#1B2A4A' },
});
