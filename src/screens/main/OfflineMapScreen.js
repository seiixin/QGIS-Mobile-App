import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const offlineMaps = [
  { id: 1, name: 'Evacuation Map — Apalit', resolution: '1920 × 1080' },
  { id: 2, name: 'Ground Shaking Map', resolution: '1920 × 1080' },
  { id: 3, name: 'Liquefaction Hazard Map', resolution: '1920 × 1080' },
  { id: 4, name: 'Fault Line Overlay', resolution: '1920 × 1080' },
];

export default function OfflineMapScreen({ navigation }) {
  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Offline maps</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Keep local hazard references available without signal</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 22 }}>📥</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {offlineMaps.map((map) => (
          <TouchableOpacity key={map.id} style={styles.card} activeOpacity={0.85}>
            {/* Image placeholder */}
            <View style={styles.mapImagePlaceholder}>
              <Text style={styles.mapImageIcon}>🗺️</Text>
            </View>
            {/* Card footer */}
            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{map.name}</Text>
                <Text style={styles.cardResolution}>{map.resolution}</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={{ fontSize: 18 }}>🗺️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  mapImagePlaceholder: {
    height: 160,
    backgroundColor: '#DCE8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImageIcon: { fontSize: 48, opacity: 0.4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { ...typography.h4, color: colors.textDark, marginBottom: 3 },
  cardResolution: { ...typography.bodySmall, color: colors.textMid },
  viewBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1B2A4A',
    alignItems: 'center', justifyContent: 'center',
  },
});
