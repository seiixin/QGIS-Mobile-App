import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Switch,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const layers = [
  { id: 1, label: 'Evacuation zones' },
  { id: 2, label: 'Hazard areas' },
  { id: 3, label: 'Barangay bounds' },
];

export default function MapScreen({ navigation }) {
  const [activeLayer, setActiveLayer] = useState(null);
  const [showActive, setShowActive] = useState(true);

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Map placeholder fills all remaining space */}
      <View style={styles.mapContainer}>
        {/* Map background placeholder */}
        <View style={styles.mapBg}>
          <Text style={styles.mapBgText}>🗺️ Live Map</Text>
          <Text style={styles.mapBgSub}>Interactive tile map renders here</Text>
          <Text style={styles.mapCoords}>📍 Apalit, Pampanga  |  15.0°N, 120.7°E</Text>
        </View>

        {/* Floating card — top left */}
        <View style={styles.floatingCard}>
          <View style={styles.floatingCardRow}>
            <View style={styles.floatingCardText}>
              <Text style={styles.floatingTitle}>Live map</Text>
              <Text style={styles.floatingSubtitle}>Layers, overlays, and response context</Text>
            </View>
            <View style={styles.floatingIcon}><Text style={{ fontSize: 18 }}>🗺️</Text></View>
          </View>

          <View style={styles.layerSection}>
            <Text style={styles.layerLabel}>Layers</Text>
            <View style={styles.layerChips}>
              {layers.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.layerChip, activeLayer === l.id && styles.layerChipActive]}
                  onPress={() => setActiveLayer(activeLayer === l.id ? null : l.id)}
                >
                  <Text style={[styles.layerChipText, activeLayer === l.id && styles.layerChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Show active layer</Text>
              <Switch
                value={showActive}
                onValueChange={setShowActive}
                trackColor={{ false: colors.inputBorder, true: '#1B2A4A' }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn}><Text style={styles.zoomText}>−</Text></TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn}><Text style={styles.zoomText}>+</Text></TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1 },
  mapBg: {
    flex: 1,
    backgroundColor: '#D4E3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBgText: { fontSize: 36, marginBottom: 8 },
  mapBgSub: { ...typography.body, color: colors.textMid },
  mapCoords: {
    marginTop: 12,
    ...typography.bodySmall, color: colors.textDark,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },

  floatingCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  floatingCardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  floatingCardText: { flex: 1 },
  floatingTitle: { ...typography.h3, color: colors.textDark },
  floatingSubtitle: { ...typography.bodySmall, color: colors.textMid, marginTop: 2 },
  floatingIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.dashBg,
    alignItems: 'center', justifyContent: 'center',
  },

  layerSection: {},
  layerLabel: { ...typography.label, color: colors.textDark, marginBottom: 10 },
  layerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  layerChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.dashCardLight,
    borderRadius: 20,
  },
  layerChipActive: { backgroundColor: '#1B2A4A' },
  layerChipText: { ...typography.bodySmall, color: colors.textDark },
  layerChipTextActive: { color: colors.white },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...typography.body, color: colors.textDark },

  zoomControls: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -48 }],
    flexDirection: 'row',
    gap: 16,
  },
  zoomBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  zoomText: { fontSize: 22, color: colors.textDark, fontWeight: '300' },
});
