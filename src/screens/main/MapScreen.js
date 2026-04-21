import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import MapView, { Polyline, Polygon, Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resolveApiUrl } from '../../config/api';
import { useVoiceNavigation } from '../../hooks/useVoiceNavigation';
import { logActivity } from '../../lib/activityStore';

// ── Polygon / line layers ─────────────────────────────────────────────────────
import PoliticalBoundary from '../../data/geojson/Political_Boundary.json';
import GroundShaking     from '../../data/geojson/Ground_Shaking_Intensity.json';
import EvacCenters       from '../../data/geojson/Evacuation_Centers.json';
import OpenSpaces        from '../../data/geojson/Open_Spaces.json';
import Roads             from '../../data/geojson/ROADS.json';
import RoadsSafe         from '../../data/geojson/Roads_Safe.json';
import RoadsAverage      from '../../data/geojson/Roads_Average.json';
import RoadsPoor         from '../../data/geojson/Roads_Poor.json';
import RoadsCritical     from '../../data/geojson/Roads_Critical.json';

// ── Point layers ──────────────────────────────────────────────────────────────
import EvacPin      from '../../data/geojson/Evac_Centers_Pin.json';
import OpenPin      from '../../data/geojson/Open_Spaces_Pin.json';
import GasStations  from '../../data/geojson/Gas_Stations.json';
import Markets      from '../../data/geojson/Markets.json';
import Banks        from '../../data/geojson/Banks.json';
import Restaurants  from '../../data/geojson/Restaurants.json';

// ── Haversine distance (meters) ───────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Road condition color lookup ───────────────────────────────────────────────
// NOTE: populated after all imports via getRoadConditions()
let ROAD_CONDITIONS = [];
function initRoadConditions(safe, average, poor, critical) {
  ROAD_CONDITIONS = [
    { label: 'safe',     color: '#27AE60', data: safe     },
    { label: 'average',  color: '#F39C12', data: average  },
    { label: 'poor',     color: '#E67E22', data: poor     },
    { label: 'critical', color: '#E74C3C', data: critical },
  ];
}
const SNAP_THRESHOLD = 60;

function distPointToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  // Work in approximate meters using degree-to-meter conversion
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(pLat * Math.PI / 180);

  const px = pLng * lngScale, py = pLat * latScale;
  const ax = aLng * lngScale, ay = aLat * latScale;
  const bx = bLng * lngScale, by = bLat * latScale;

  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const nearX = ax + t * dx, nearY = ay + t * dy;
  return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
}

function classifyPoint(lat, lng, roadConditions) {
  let best = null, bestDist = SNAP_THRESHOLD;
  for (const rc of roadConditions) {
    if (!rc.data) continue;
    for (const feature of rc.data.features) {
      const lines =
        feature.geometry.type === 'LineString'      ? [feature.geometry.coordinates]
        : feature.geometry.type === 'MultiLineString'? feature.geometry.coordinates
        : [];
      for (const line of lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const [aLng, aLat] = line[i];
          const [bLng, bLat] = line[i + 1];
          const d = distPointToSegment(lat, lng, aLat, aLng, bLat, bLng);
          if (d < bestDist) { bestDist = d; best = rc.color; }
        }
      }
    }
  }
  return best; // null = no road condition matched
}

// Split a route path into colored segments based on road condition proximity
function colorizeRoute(path, roadConditions, fallbackColor) {
  if (path.length < 2) return [{ coords: path, color: fallbackColor }];

  const classified = path.map(pt => ({
    pt,
    color: classifyPoint(pt.latitude, pt.longitude, roadConditions) || fallbackColor,
  }));

  const segments = [];
  let current = [classified[0].pt];
  let currentColor = classified[0].color;

  for (let i = 1; i < classified.length; i++) {
    const { pt, color } = classified[i];
    if (color === currentColor) {
      current.push(pt);
    } else {
      current.push(pt); // overlap point for continuity
      segments.push({ coords: current, color: currentColor });
      current = [pt];
      currentColor = color;
    }
  }
  if (current.length > 1) segments.push({ coords: current, color: currentColor });
  return segments;
}

// ── Route via Laravel proxy (avoids emulator network restrictions) ────────────
async function getRoadRoute(fromLat, fromLng, toLat, toLng, token) {
  try {
    const url = resolveApiUrl(
      `/route?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}`
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.ok && data.coordinates?.length > 1) {
      return {
        path: data.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
        distanceM: data.distance,
        isFallback: false,
      };
    }
  } catch (e) {
    console.warn('Route proxy error:', e.message);
  }
  // Fallback: straight line
  return {
    path: [
      { latitude: fromLat, longitude: fromLng },
      { latitude: toLat, longitude: toLng },
    ],
    distanceM: haversine(fromLat, fromLng, toLat, toLng),
    isFallback: true,
  };
}

// ── Build destination list from all point layers ──────────────────────────────
function buildDestinations() {
  const dests = [];
  const add = (geojson, type, emoji, color) => {
    geojson.features.forEach((f, i) => {
      if (f.geometry.type !== 'Point') return;
      const [lng, lat] = f.geometry.coordinates;
      dests.push({ id: `${type}-${i}`, type, emoji, color, latitude: lat, longitude: lng });
    });
  };
  add(OpenPin,     'open',   '🟢', '#27AE60');
  add(EvacPin,     'evac',   '🏠', '#2980B9');
  add(GasStations, 'gas',    '⛽', '#E67E22');
  add(Restaurants, 'food',   '🍽️', '#C0392B');
  add(Markets,     'market', '🛒', '#8E44AD');
  add(Banks,       'bank',   '🏦', '#2980B9');
  return dests;
}

const ALL_DESTINATIONS = buildDestinations();

// ── Map region ────────────────────────────────────────────────────────────────
const SAN_VICENTE_REGION = {
  latitude: 14.9505, longitude: 120.748,
  latitudeDelta: 0.025, longitudeDelta: 0.025,
};

// ── Layer catalog ─────────────────────────────────────────────────────────────
const POINT_LAYERS = [
  { key: 'open_pin',  label: 'Open Spaces',  emoji: '🟢', color: '#27AE60', size: 40, data: OpenPin,     defaultOn: true  },
  { key: 'evac_pin',  label: 'Evac Centers', emoji: '🏠', color: '#2980B9', size: 32, data: EvacPin,     defaultOn: true  },
  { key: 'gas',       label: 'Gas',          emoji: '⛽', color: '#E67E22', size: 28, data: GasStations,  defaultOn: true  },
  { key: 'resto',     label: 'Food',         emoji: '🍽️', color: '#C0392B', size: 28, data: Restaurants,  defaultOn: true  },
  { key: 'markets',   label: 'Markets',      emoji: '🛒', color: '#8E44AD', size: 28, data: Markets,      defaultOn: true  },
  { key: 'banks',     label: 'Banks',        emoji: '🏦', color: '#2980B9', size: 28, data: Banks,        defaultOn: true  },
];

const POLYGON_LAYERS = [
  { key: 'boundary', label: 'Boundary',       stroke: '#1B2A4A', fill: 'rgba(0,0,0,0)',        data: PoliticalBoundary, defaultOn: true,  lineDash: [8, 6] },
  { key: 'shaking',  label: 'Ground Shaking', stroke: '#C0392B', fill: 'rgba(192,57,43,0.4)',  data: GroundShaking,     defaultOn: false },
  { key: 'evac',     label: 'Evac Areas',     stroke: '#2980B9', fill: 'rgba(41,128,185,0.3)', data: EvacCenters,       defaultOn: true  },
  { key: 'open',     label: 'Open Areas',     stroke: '#27AE60', fill: 'rgba(39,174,96,0.3)',  data: OpenSpaces,        defaultOn: true  },
  { key: 'roads',    label: 'Roads',          stroke: '#95A5A6', fill: 'transparent',          data: Roads,             defaultOn: false },
  { key: 'safe',     label: 'Safe',           stroke: '#27AE60', fill: 'transparent',          data: RoadsSafe,         defaultOn: true  },
  { key: 'average',  label: 'Average',        stroke: '#F39C12', fill: 'transparent',          data: RoadsAverage,      defaultOn: true  },
  { key: 'poor',     label: 'Poor',           stroke: '#E67E22', fill: 'transparent',          data: RoadsPoor,         defaultOn: true  },
  { key: 'critical', label: 'Critical',       stroke: '#E74C3C', fill: 'transparent',          data: RoadsCritical,     defaultOn: true  },
];

const ALL_LAYERS = [...POLYGON_LAYERS, ...POINT_LAYERS];

// ── Dark map style (Google Maps JSON) ─────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
];

// ── Renderers ─────────────────────────────────────────────────────────────────
function coordsToLatLng(ring) {
  return ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

function renderPolygonFeature(feature, cfg, idx) {
  const { type, coordinates } = feature.geometry;
  if (!coordinates) return null;
  const isLine = type === 'LineString' || type === 'MultiLineString';
  const rings =
    type === 'Polygon'           ? [coordinates]
    : type === 'MultiPolygon'    ? coordinates
    : type === 'LineString'      ? [[coordinates]]
    : type === 'MultiLineString' ? [coordinates]
    : [];

  return rings.flatMap((poly, pi) =>
    poly.map((ring, ri) => {
      const pts = coordsToLatLng(ring);
      const key = `${cfg.key}-${idx}-${pi}-${ri}`;
      if (isLine) {
        return (
          <Polyline key={key} coordinates={pts} strokeColor={cfg.stroke}
            strokeWidth={cfg.key === 'arrows' ? 3 : 2}
            lineDashPattern={cfg.lineDash || null} />
        );
      }
      if (cfg.lineDash) {
        return (
          <Polyline key={key} coordinates={[...pts, pts[0]]} strokeColor={cfg.stroke}
            strokeWidth={2} lineDashPattern={cfg.lineDash} />
        );
      }
      return (
        <Polygon key={key} coordinates={pts} strokeColor={cfg.stroke}
          fillColor={cfg.fill} strokeWidth={1.5} />
      );
    })
  );
}

function PointMarker({ feature, cfg, idx, onPress, selectedDestId }) {
  const [ready, setReady] = useState(false);
  const { type, coordinates } = feature.geometry;
  if (type !== 'Point' || !coordinates) return null;
  const [lng, lat] = coordinates;
  const size = cfg.size || 30;
  const destId = `${cfg.key}-${idx}`;
  const isSelected = selectedDestId === destId;
  const hasSelection = selectedDestId !== null;
  // Dim when something else is selected
  const opacity = hasSelection && !isSelected ? 0.25 : 1;
  // Selected marker gets a bigger ring
  const borderWidth = isSelected ? 3.5 : 2.5;
  const borderColor = isSelected ? '#FFD700' : '#fff';

  return (
    <Marker
      key={destId}
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={!ready}
      zIndex={isSelected ? 999 : 1}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress && onPress(destId, lat, lng, cfg);
      }}
    >
      <View
        onLayout={() => setReady(true)}
        style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: cfg.color,
          alignItems: 'center', justifyContent: 'center',
          borderWidth, borderColor,
          opacity,
          elevation: isSelected ? 8 : 4,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.5 : 0.3, shadowRadius: 3,
        }}
      >
        <Text style={{ fontSize: size * 0.45, lineHeight: size * 0.55 }}>{cfg.emoji}</Text>
      </View>
    </Marker>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const { token, settings } = useAuth();
  const theme = useTheme();
  const mapRef    = useRef(null);
  const regionRef = useRef(SAN_VICENTE_REGION);

  // Voice navigation
  const {
    isNavigating: voiceActive,
    instruction: voiceInstruction,
    distRemaining: voiceDistRemaining,
    arrived,
    startNavigation,
    stopNavigation: stopVoice,
  } = useVoiceNavigation({ language: settings?.language || 'English' });

  // Init road conditions once with imported data
  useEffect(() => {
    initRoadConditions(RoadsSafe, RoadsAverage, RoadsPoor, RoadsCritical);
  }, []);

  const [active, setActive] = useState(() => {
    const init = {};
    ALL_LAYERS.forEach(l => { init[l.key] = l.defaultOn; });
    return init;
  });

  const [userLocation,   setUserLocation]   = useState(null);
  const [activeRoute,    setActiveRoute]    = useState(null);
  const [colorSegments,  setColorSegments]  = useState([]);
  const [routeLoading,   setRouteLoading]   = useState(false);
  const [selectedDestId, setSelectedDestId] = useState(null);
  const [arrivalModal,   setArrivalModal]   = useState(null); // { emoji, label }

  // Show arrival modal when voice navigation detects arrival
  useEffect(() => {
    if (arrived && activeRoute) {
      setArrivalModal({ emoji: activeRoute.emoji, label: activeRoute.label });
      logActivity({
        type:  'arrival',
        label: 'You have arrived!',
        sub:   `Destination: ${activeRoute.emoji} ${activeRoute.label}`,
      });
    }
  }, [arrived]);

  // ── Location tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Enable location to get directions to safe areas.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUserLocation(loc);
      mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 800);

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        ({ coords }) => setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const handleDestinationPress = async (destId, destLat, destLng, cfg) => {
    if (!userLocation) {
      Alert.alert('No location', 'Waiting for your GPS location…');
      return;
    }
    if (selectedDestId === destId) {
      setActiveRoute(null);
      setSelectedDestId(null);
      return;
    }
    setSelectedDestId(destId);
    setRouteLoading(true);
    try {
      const result = await getRoadRoute(
        userLocation.latitude, userLocation.longitude,
        destLat, destLng,
        token
      );

      if (result.isFallback) {
        Alert.alert(
          'Road routing unavailable',
          'Could not reach routing server. Showing straight-line direction instead.\n\nMake sure the device has internet access.',
          [{ text: 'OK' }]
        );
      }

      setActiveRoute({ ...result, destId, color: cfg.color, label: cfg.label, emoji: cfg.emoji });
      // Colorize route segments by road condition
      const segments = colorizeRoute(result.path, ROAD_CONDITIONS, cfg.color);
      setColorSegments(segments);
      // Start voice navigation
      startNavigation(result.path, cfg.label);

      // Fit map to show full route
      if (result.path.length >= 2) {
        const lats = result.path.map(p => p.latitude);
        const lngs = result.path.map(p => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const pad = 0.005;
        mapRef.current?.animateToRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat + pad, 0.01),
          longitudeDelta: Math.max(maxLng - minLng + pad, 0.01),
        }, 600);
      }
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setActiveRoute(null);
    setColorSegments([]);
    setSelectedDestId(null);
    setArrivalModal(null);
    stopVoice();
  };

  const zoom = (dir) => {
    const r = regionRef.current;
    const factor = dir === 'in' ? 0.5 : 2;
    const next = { ...r, latitudeDelta: r.latitudeDelta * factor, longitudeDelta: r.longitudeDelta * factor };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 250);
  };

  const toggle = (key) => setActive(prev => ({ ...prev, [key]: !prev[key] }));

  const showGuidance = () => Alert.alert(
    '🚨 Earthquake Safety',
    '• Tap any marker (🟢 open space, 🏠 evac center, ⛽ gas, etc.) to get road directions from your location\n\n' +
    '• Prioritize GREEN open spaces during aftershocks\n\n' +
    '• Follow the blue route line to your destination\n\n' +
    '• Tap the same marker again to clear the route',
    [{ text: 'Got it' }]
  );

  const formatDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <View style={styles.container}>

        <MapView ref={mapRef} style={styles.map} provider={PROVIDER_DEFAULT}
          initialRegion={SAN_VICENTE_REGION}
          mapType="standard"
          customMapStyle={theme.dark ? DARK_MAP_STYLE : []}
          onRegionChange={r => { regionRef.current = r; }}>

          {/* Polygon / line layers — road condition layers dim when route active */}
          {POLYGON_LAYERS.map(cfg => {
            if (!active[cfg.key]) return null;
            const isRoadCondition = ['safe', 'average', 'poor', 'critical'].includes(cfg.key);
            const dimmed = activeRoute && isRoadCondition;
            const cfgToUse = dimmed
              ? { ...cfg, stroke: cfg.stroke + '44' }  // append 44 hex = ~27% opacity
              : cfg;
            return cfg.data.features.map((f, i) => renderPolygonFeature(f, cfgToUse, i));
          })}

          {/* Point markers — tappable */}
          {POINT_LAYERS.map(cfg =>
            active[cfg.key]
              ? cfg.data.features.map((f, i) => (
                  <PointMarker
                    key={`${cfg.key}-${i}`}
                    feature={f} cfg={cfg} idx={i}
                    onPress={handleDestinationPress}
                    selectedDestId={selectedDestId}
                  />
                ))
              : null
          )}

          {/* User location */}
          {userLocation && (
            <>
              <Circle center={userLocation} radius={25}
                fillColor="rgba(59,79,224,0.2)" strokeColor="#3B4FE0" strokeWidth={2} />
              <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={999}>
                <View style={styles.userDot} />
              </Marker>
            </>
          )}

          {/* Road-condition colored route segments */}
          {colorSegments.map((seg, i) => (
            <Polyline
              key={`route-seg-${i}`}
              coordinates={seg.coords}
              strokeColor={seg.color}
              strokeWidth={6}
              zIndex={998}
            />
          ))}
        </MapView>

        {/* Voice instruction banner */}
        {voiceActive && voiceInstruction ? (
          <View style={styles.voiceBanner}>
            <Text style={styles.voiceBannerIcon}>🔊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.voiceBannerText}>{voiceInstruction}</Text>
              {voiceDistRemaining > 0 && (
                <Text style={styles.voiceBannerDist}>
                  {voiceDistRemaining >= 1000
                    ? `${(voiceDistRemaining / 1000).toFixed(1)} km remaining`
                    : `${Math.round(voiceDistRemaining)} m remaining`}
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {/* Route info card */}
        {activeRoute && (
          <View style={[styles.routeCard, { backgroundColor: theme.dark ? 'rgba(13,27,42,0.97)' : 'rgba(255,255,255,0.97)' }]}>
            <View style={styles.routeCardRow}>
              <Text style={styles.routeCardEmoji}>{activeRoute.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeCardLabel, { color: theme.textPrimary }]}>{activeRoute.label}</Text>
                <Text style={[styles.routeCardDist, { color: theme.textSecondary }]}>
                {formatDist(activeRoute.distanceM)}{activeRoute.isFallback ? ' (straight line)' : ' via road'}
              </Text>
              </View>
              <TouchableOpacity style={[styles.routeClearBtn, { backgroundColor: theme.border }]} onPress={clearRoute}>
                <Text style={[styles.routeClearText, { color: theme.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Route loading spinner */}
        {routeLoading && (
          <View style={[styles.routeLoading, { backgroundColor: theme.dark ? 'rgba(13,27,42,0.97)' : 'rgba(255,255,255,0.97)' }]}>
            <ActivityIndicator color={colors.btnPrimary} />
            <Text style={[styles.routeLoadingText, { color: theme.textPrimary }]}>Getting route…</Text>
          </View>
        )}

        {/* Guidance + zoom */}
        <TouchableOpacity style={styles.guidanceBtn} onPress={showGuidance} activeOpacity={0.85}>
          <Text style={styles.guidanceEmoji}>🚨</Text>
        </TouchableOpacity>

        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[styles.zoomBtn, { backgroundColor: theme.dark ? 'rgba(27,42,74,0.95)' : 'rgba(255,255,255,0.96)' }]}
            onPress={() => zoom('in')} activeOpacity={0.8}>
            <Text style={[styles.zoomText, { color: theme.textPrimary }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomBtn, { backgroundColor: theme.dark ? 'rgba(27,42,74,0.95)' : 'rgba(255,255,255,0.96)' }]}
            onPress={() => zoom('out')} activeOpacity={0.8}>
            <Text style={[styles.zoomText, { color: theme.textPrimary }]}>−</Text>
          </TouchableOpacity>
        </View>

        {/* Layer panel */}
        <View style={[styles.panel, { backgroundColor: theme.dark ? 'rgba(13,27,42,0.97)' : 'rgba(255,255,255,0.97)' }]}>
          <Text style={[styles.panelTitle, { color: theme.textPrimary }]}>Layers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {ALL_LAYERS.map(cfg => {
              const on = active[cfg.key];
              const dotColor = cfg.stroke || cfg.color;
              return (
                <TouchableOpacity key={cfg.key}
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }, on && { backgroundColor: dotColor, borderColor: dotColor }]}
                  onPress={() => toggle(cfg.key)} activeOpacity={0.8}>
                  {'emoji' in cfg
                    ? <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
                    : <View style={[styles.chipDot, { backgroundColor: on ? colors.white : dotColor }]} />
                  }
                  <Text style={[styles.chipText, { color: theme.textSecondary }, on && styles.chipTextOn]}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

      </View>

      {/* Arrival modal */}
      <Modal
        visible={Boolean(arrivalModal)}
        transparent
        animationType="fade"
        onRequestClose={() => { setArrivalModal(null); clearRoute(); }}
      >
        <View style={styles.arrivalOverlay}>
          <View style={[styles.arrivalCard, { backgroundColor: theme.card }]}>
            {/* Animated checkmark area */}
            <View style={styles.arrivalIconRing}>
              <Text style={styles.arrivalCheckmark}>✓</Text>
            </View>

            <Text style={[styles.arrivalTitle, { color: theme.textPrimary }]}>You have arrived!</Text>
            <Text style={styles.arrivalEmoji}>{arrivalModal?.emoji}</Text>
            <Text style={styles.arrivalDest}>{arrivalModal?.label}</Text>
            <Text style={[styles.arrivalSub, { color: theme.textSecondary }]}>
              You have successfully reached your destination.{'\n'}
              Stay safe and be aware of your surroundings.
            </Text>

            <TouchableOpacity
              style={styles.arrivalBtn}
              onPress={() => { setArrivalModal(null); clearRoute(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.arrivalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  userDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#3B4FE0',
    borderWidth: 3, borderColor: '#fff',
    elevation: 6,
  },

  voiceBanner: {
    position: 'absolute', top: 16, left: 14, right: 70,
    backgroundColor: '#1B2A4A',
    borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  voiceBannerIcon: { fontSize: 22 },
  voiceBannerText: { ...typography.h4, color: colors.white, lineHeight: 20 },
  voiceBannerDist: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Arrival modal
  arrivalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  arrivalCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  arrivalIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#27AE60',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  arrivalCheckmark: {
    fontSize: 40, color: colors.white, fontWeight: '700', lineHeight: 48,
  },
  arrivalTitle: {
    ...typography.h1, color: colors.textDark,
    marginBottom: 12, textAlign: 'center',
  },
  arrivalEmoji: { fontSize: 40, marginBottom: 6 },
  arrivalDest: {
    ...typography.h3, color: colors.btnPrimary,
    marginBottom: 12, textAlign: 'center',
  },
  arrivalSub: {
    ...typography.body, color: colors.textMid,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  arrivalBtn: {
    backgroundColor: '#27AE60',
    borderRadius: 30, paddingVertical: 14,
    paddingHorizontal: 48,
    elevation: 3,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  arrivalBtnText: { ...typography.button, color: colors.white, letterSpacing: 1 },

  routeCard: {
    position: 'absolute', top: 16, left: 14, right: 70,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14, padding: 12, elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  routeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeCardEmoji: { fontSize: 24 },
  routeCardLabel: { ...typography.label, color: colors.textDark },
  routeCardDist: { ...typography.bodySmall, color: colors.textMid, marginTop: 2 },
  routeClearBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.inputBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  routeClearText: { fontSize: 12, color: colors.textDark, fontWeight: '700' },

  routeLoading: {
    position: 'absolute', top: 16, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 5,
  },
  routeLoadingText: { ...typography.bodySmall, color: colors.textDark },

  guidanceBtn: {
    position: 'absolute', top: 16, right: 14,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E74C3C',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
  },
  guidanceEmoji: { fontSize: 24 },

  zoomControls: { position: 'absolute', right: 14, bottom: 130, gap: 8 },
  zoomBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  zoomText: { fontSize: 24, color: colors.textDark, fontWeight: '300', lineHeight: 28 },

  panel: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16, padding: 12, elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8,
  },
  panelTitle: { ...typography.label, color: colors.textDark, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: colors.inputBorder, backgroundColor: colors.white,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipEmoji: { fontSize: 12 },
  chipText: { ...typography.bodySmall, color: colors.textMid },
  chipTextOn: { color: colors.white, fontWeight: '700' },
});
