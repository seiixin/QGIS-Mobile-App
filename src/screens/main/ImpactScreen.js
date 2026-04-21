import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/apiClient';

// ── Static breakdown data from PHIVOLCS PEIS simulation ──────────────────────
// Keyed by fault_name to match production API
const BREAKDOWN_DATA = {
  'East Zambales Fault': {
    dayColor:   '#E67E22',
    nightColor: '#F0A500',
    day:   { slight: 255, nonLife: 17, lifeThreat: 8,  fatalities: 15 },
    night: { slight: 302, nonLife: 10, lifeThreat: 8,  fatalities: 18 },
  },
  'West Valley Fault': {
    dayColor:   '#E74C3C',
    nightColor: '#F1948A',
    day:   { slight: 62, nonLife: 8, lifeThreat: 1, fatalities: 3 },
    night: { slight: 70, nonLife: 5, lifeThreat: 1, fatalities: 5 },
  },
};

const INJURY_ROWS = [
  { label: 'Slight Injuries',        key: 'slight'      },
  { label: 'Non-Life Threatening',   key: 'nonLife'     },
  { label: 'Life Threatening',       key: 'lifeThreat'  },
  { label: 'Fatalities',             key: 'fatalities'  },
];

// ── Comparison table: Day vs Night ───────────────────────────────────────────
function BreakdownTable({ breakdown }) {
  const { dayColor, nightColor, day, night } = breakdown;

  return (
    <View style={styles.table}>
      {/* Header row */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.tableCellLabel]} />
        <View style={[styles.tableCell, styles.tableCellDay, { backgroundColor: dayColor }]}>
          <Text style={styles.tableHeaderText}>☀️ Day</Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellNight, { backgroundColor: nightColor }]}>
          <Text style={styles.tableHeaderText}>🌙 Night</Text>
        </View>
      </View>

      {/* Data rows */}
      {INJURY_ROWS.map((row, i) => (
        <View key={row.key} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
          <Text style={[styles.tableCell, styles.tableCellLabel]}>{row.label}</Text>
          <Text style={[styles.tableCell, styles.tableCellDay, styles.tableCellNum, { color: dayColor }]}>
            {day[row.key] ?? '—'}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellNight, styles.tableCellNum, { color: nightColor }]}>
            {night[row.key] ?? '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Scenario card ─────────────────────────────────────────────────────────────
function ImpactCard({ item }) {
  const breakdown = BREAKDOWN_DATA[item.fault_name];

  return (
    <View style={styles.card}>
      <Text style={styles.scenarioName}>{item.scenario_name}</Text>
      <Text style={styles.faultName}>Fault: {item.fault_name}</Text>

      {breakdown ? (
        <BreakdownTable breakdown={breakdown} />
      ) : (
        // Historical events — no day/night data
        <View style={[styles.statBox, { backgroundColor: '#FFF0F0' }]}>
          <Text style={styles.statLabel}>Total Casualties</Text>
          <Text style={styles.statValueRed}>
            👤 {Number(item.casualties || 0).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ImpactScreen({ navigation }) {
  const { token } = useAuth();
  const [impactData, setImpactData] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const loadImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/impact-results', { token });
      setImpactData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadImpact(); }, [loadImpact]));

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Impact results</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Estimated casualties by fault scenario</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 22 }}>📊</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {loading && <ActivityIndicator color={colors.btnPrimary} style={styles.loader} />}
        {!loading && error ? <Text style={styles.statusText}>{error}</Text> : null}
        {!loading && !error && impactData.length === 0 && (
          <Text style={styles.statusText}>No impact results available yet.</Text>
        )}
        {impactData.map((item) => (
          <ImpactCard key={item.id} item={item} />
        ))}
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
  scroll: { padding: 16, paddingBottom: 24 },
  loader: { marginTop: 24 },
  statusText: { ...typography.body, color: colors.textMid, textAlign: 'center', marginTop: 24 },

  card: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  scenarioName: { ...typography.h3, color: colors.textDark, marginBottom: 4 },
  faultName: { ...typography.bodySmall, color: colors.textMid, marginBottom: 14 },

  // Breakdown table
  table: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: colors.white,
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCell: { paddingVertical: 10, paddingHorizontal: 8 },
  tableCellLabel: { flex: 2, ...typography.bodySmall, color: colors.textDark, alignSelf: 'center' },
  tableCellDay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableCellNight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableHeaderText: { ...typography.label, color: colors.white, fontSize: 11, textAlign: 'center' },
  tableCellNum: { ...typography.h4, textAlign: 'center', fontWeight: '700' },

  statBox: { borderRadius: 10, padding: 12 },
  statLabel: { ...typography.bodySmall, color: colors.textMid, marginBottom: 6 },
  statValueRed: { ...typography.label, color: '#EF4444' },
});
