import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, Image, Dimensions, Animated,
  PanResponder,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Static offline maps bundled with the app ───────────────────────────────
const OFFLINE_MAPS = [
  {
    id: 1,
    name: 'Flying V Gas to St. Peter',
    subtitle: 'San Vicente, Apalit, Pampanga',
    source: require('../../../assets/evac-map-flying-v.png'),
  },
  {
    id: 2,
    name: 'San Tiago Court to San Padre Pio Chapel',
    subtitle: 'San Vicente, Apalit, Pampanga',
    source: require('../../../assets/evac-map-san-tiago.png'),
  },
  {
    id: 3,
    name: 'St. James School to Babul Rahman Mosque',
    subtitle: 'San Vicente, Apalit, Pampanga',
    source: require('../../../assets/evac-map-st-james.png'),
  },
];

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;

// ─── Zoomable image viewer ───────────────────────────────────────────────────
function ZoomableViewer({ source, onClose, title }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // raw refs for gesture math
  const scaleVal  = useRef(1);
  const txVal     = useRef(0);
  const tyVal     = useRef(0);
  const lastScale = useRef(1);
  const lastTx    = useRef(0);
  const lastTy    = useRef(0);
  const initDist  = useRef(null);

  function clampScale(s) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  }

  function applyZoom(newScale) {
    const clamped = clampScale(newScale);
    scaleVal.current = clamped;
    // re-center when zooming out to 1
    if (clamped === MIN_SCALE) {
      txVal.current = 0;
      tyVal.current = 0;
      translateX.setValue(0);
      translateY.setValue(0);
    }
    scale.setValue(clamped);
    lastScale.current = clamped;
  }

  function zoomIn()  { applyZoom(scaleVal.current + ZOOM_STEP); }
  function zoomOut() { applyZoom(scaleVal.current - ZOOM_STEP); }
  function resetZoom() { applyZoom(MIN_SCALE); }

  function dist(touches) {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        lastTx.current = txVal.current;
        lastTy.current = tyVal.current;
        lastScale.current = scaleVal.current;
        initDist.current = null;
      },

      onPanResponderMove: (_, gestureState) => {
        const { touches } = gestureState;

        if (touches && touches.length === 2) {
          // pinch
          const d = dist(touches);
          if (initDist.current === null) {
            initDist.current = d;
          }
          const ratio = d / initDist.current;
          const newScale = clampScale(lastScale.current * ratio);
          scaleVal.current = newScale;
          scale.setValue(newScale);
        } else {
          // pan (only when zoomed in)
          if (scaleVal.current > 1) {
            const newTx = lastTx.current + gestureState.dx;
            const newTy = lastTy.current + gestureState.dy;
            txVal.current = newTx;
            tyVal.current = newTy;
            translateX.setValue(newTx);
            translateY.setValue(newTy);
          }
        }
      },

      onPanResponderRelease: () => {
        lastScale.current = scaleVal.current;
        lastTx.current    = txVal.current;
        lastTy.current    = tyVal.current;
        initDist.current  = null;
        // snap back to center if scale is 1
        if (scaleVal.current <= MIN_SCALE) {
          txVal.current = 0;
          tyVal.current = 0;
          translateX.setValue(0);
          translateY.setValue(0);
        }
      },
    })
  ).current;

  return (
    <View style={styles.viewerBg}>
      {/* Header bar */}
      <View style={styles.viewerHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.viewerTitle} numberOfLines={2}>{title}</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={resetZoom}>
          <Text style={styles.resetBtnText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Image canvas */}
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Animated.Image
          source={source}
          style={[
            styles.zoomImage,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Zoom buttons */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
          <Text style={styles.zoomBtnText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
          <Text style={styles.zoomBtnText}>－</Text>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <Text style={styles.hint}>Pinch to zoom · Drag to pan</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function OfflineMapScreen({ navigation }) {
  const theme = useTheme();
  const t     = useTypography();
  const { t: tr } = useTranslation();
  const [viewingMap, setViewingMap] = useState(null);

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />

      {/* Hero */}
      <View style={styles.heroBanner}>
        <Text style={[styles.heroEyebrow, { fontSize: t.bodySmall.fontSize }]}>
          {tr('Offline maps')}
        </Text>
        <View style={styles.heroRow}>
          <Text style={[styles.heroTitle, { fontSize: t.h3.fontSize }]}>
            {tr('Evacuation maps available without signal')}
          </Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 22 }}>🗺️</Text></View>
        </View>
      </View>

      <ScrollView
        style={[styles.bg, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scroll}
      >
        {OFFLINE_MAPS.map((map) => (
          <View key={map.id} style={[styles.card, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.thumbContainer}
              activeOpacity={0.85}
              onPress={() => setViewingMap(map)}
            >
              <Image source={map.source} style={styles.thumb} resizeMode="cover" />
              <View style={styles.thumbOverlay}>
                <Text style={[styles.thumbOverlayText, { fontSize: t.bodySmall.fontSize }]}>
                  {tr('Tap to view')}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: theme.textPrimary, fontSize: t.h4.fontSize }]}>
                  {map.name}
                </Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>
                  {map.subtitle}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewBtn} onPress={() => setViewingMap(map)}>
                <Text style={[styles.viewBtnText, { fontSize: t.bodySmall.fontSize }]}>
                  {tr('View')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Full-screen zoomable viewer */}
      <Modal
        visible={Boolean(viewingMap)}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setViewingMap(null)}
      >
        {viewingMap && (
          <ZoomableViewer
            source={viewingMap.source}
            title={viewingMap.name}
            onClose={() => setViewingMap(null)}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.dashBg },

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

  scroll: { padding: 16, paddingBottom: 32 },

  card: {
    borderRadius: 18, marginBottom: 16, overflow: 'hidden',
    elevation: 2,
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
  cardName: { ...typography.h4, color: colors.textDark, marginBottom: 2 },
  cardSub:  { ...typography.bodySmall, color: colors.textMid },
  viewBtn: {
    backgroundColor: '#1B2A4A', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  viewBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },

  // ── Viewer ──────────────────────────────────────────────────────────────
  viewerBg: { flex: 1, backgroundColor: '#000' },

  viewerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  viewerTitle: {
    flex: 1, ...typography.h4, color: '#fff',
    marginHorizontal: 12, textAlign: 'center',
  },
  resetBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  resetBtnText: { color: '#fff', fontSize: 20 },

  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zoomImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
  },

  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 60,
    gap: 10,
  },
  zoomBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
    marginBottom: 8,
  },
  zoomBtnText: { fontSize: 26, fontWeight: '700', color: '#1B2A4A', lineHeight: 30 },

  hint: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
