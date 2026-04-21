import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Modal, Image, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/apiClient';
import { resolveApiUrl } from '../../config/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function OfflineMapScreen({ navigation }) {
  const { token } = useAuth();
  const [offlineMaps, setOfflineMaps] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [viewingMap, setViewingMap]   = useState(null); // { name, url }

  const loadOfflineMaps = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const maps = await apiRequest('/maps', { token });
      const results = await Promise.all(
        maps.map(async (map) => {
          const offline = await apiRequest(`/maps/${map.id}/offline`, { token });
          return offline.map((item) => ({ ...item, map_name: map.name }));
        })
      );
      setOfflineMaps(results.flat());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadOfflineMaps(); }, [loadOfflineMaps]));

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />

      {/* Hero */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Offline maps</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Keep local hazard references available without signal</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 22 }}>📥</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {loading && <ActivityIndicator color={colors.btnPrimary} style={styles.loader} />}
        {!loading && error ? <Text style={styles.statusText}>{error}</Text> : null}
        {!loading && !error && offlineMaps.length === 0 && (
          <Text style={styles.statusText}>No offline map exports are available yet.</Text>
        )}

        {offlineMaps.map((map) => {
          const imageUrl = resolveApiUrl(map.image_path);
          return (
            <View key={map.id} style={styles.card}>
              {/* Thumbnail */}
              <TouchableOpacity
                style={styles.thumbContainer}
                activeOpacity={0.85}
                onPress={() => setViewingMap({ name: map.map_name, url: imageUrl })}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.thumb}
                  resizeMode="cover"
                  defaultSource={require('../../../assets/icon.png')}
                />
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbOverlayText}>Tap to view</Text>
                </View>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{map.map_name}</Text>
                  <Text style={styles.cardResolution}>{map.resolution || 'Resolution unavailable'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => setViewingMap({ name: map.map_name, url: imageUrl })}
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Full-screen image viewer modal */}
      <Modal
        visible={Boolean(viewingMap)}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingMap(null)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setViewingMap(null)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {viewingMap && (
            <>
              <Text style={styles.modalTitle}>{viewingMap.name}</Text>
              <Image
                source={{ uri: viewingMap.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </>
          )}
        </View>
      </Modal>
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
    backgroundColor: colors.white, borderRadius: 18,
    marginBottom: 16, overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  thumbContainer: { height: 180, position: 'relative' },
  thumb: { width: '100%', height: '100%', backgroundColor: '#DCE8F8' },
  thumbOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 6, alignItems: 'center',
  },
  thumbOverlayText: { ...typography.bodySmall, color: colors.white },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { ...typography.h4, color: colors.textDark, marginBottom: 3 },
  cardResolution: { ...typography.bodySmall, color: colors.textMid },
  viewBtn: {
    backgroundColor: '#1B2A4A', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  viewBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },

  // Modal
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute', top: 48, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  modalCloseText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  modalTitle: {
    ...typography.h3, color: colors.white,
    marginBottom: 12, paddingHorizontal: 24, textAlign: 'center',
  },
  modalImage: {
    width: SCREEN_W - 32,
    height: SCREEN_H * 0.7,
  },
});
