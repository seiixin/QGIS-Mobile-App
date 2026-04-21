/**
 * useVoiceNavigation
 *
 * Provides Google Maps / Waze-style voice-guided navigation.
 *
 * Features:
 *  - Real-time GPS tracking via expo-location
 *  - Route progress monitoring (closest point on route)
 *  - Distance-based instruction triggering (200m, 50m, arrival)
 *  - Turn detection from OSRM route geometry (bearing change)
 *  - Text-to-speech via expo-speech
 *  - Debounced announcements (no repeated prompts)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';

// ── Geometry helpers ──────────────────────────────────────────────────────────

function toRad(deg) { return deg * Math.PI / 180; }

/** Haversine distance in meters between two {latitude, longitude} points */
function distanceBetween(a, b) {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

/** Compass bearing (degrees 0-360) from point a → b */
function bearing(a, b) {
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude), lat2 = toRad(b.latitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** Signed angle difference (-180 to 180) */
function angleDiff(from, to) {
  let d = (to - from + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/**
 * Derive a turn instruction from the bearing change at a route waypoint.
 * Returns a string like "Turn right", "Turn left", "Go straight", etc.
 */
function turnInstruction(prev, pivot, next) {
  const inBearing  = bearing(prev, pivot);
  const outBearing = bearing(pivot, next);
  const diff = angleDiff(inBearing, outBearing);

  if (Math.abs(diff) < 20)  return 'Go straight';
  if (diff > 20 && diff <= 60)  return 'Bear right';
  if (diff > 60 && diff <= 120) return 'Turn right';
  if (diff > 120)               return 'Make a sharp right turn';
  if (diff < -20 && diff >= -60)  return 'Bear left';
  if (diff < -60 && diff >= -120) return 'Turn left';
  return 'Make a sharp left turn';
}

/**
 * Build a list of voice waypoints from a route path.
 * Each waypoint has: { index, instruction, distFromStart }
 */
function buildWaypoints(path) {
  if (path.length < 3) return [];

  const waypoints = [];
  let distFromStart = 0;

  for (let i = 1; i < path.length - 1; i++) {
    distFromStart += distanceBetween(path[i - 1], path[i]);
    const instruction = turnInstruction(path[i - 1], path[i], path[i + 1]);
    // Only add waypoints where there's an actual turn (skip straight segments)
    if (instruction !== 'Go straight') {
      waypoints.push({ index: i, instruction, distFromStart });
    }
  }

  return waypoints;
}

/** Find the index of the closest point on the route to the user */
function closestPointIndex(userPos, path) {
  let best = 0, bestDist = Infinity;
  path.forEach((pt, i) => {
    const d = distanceBetween(userPos, pt);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

/** Total remaining distance from a given index to end of route */
function remainingDistance(path, fromIndex) {
  let d = 0;
  for (let i = fromIndex; i < path.length - 1; i++) {
    d += distanceBetween(path[i], path[i + 1]);
  }
  return d;
}

// ── TTS helper ────────────────────────────────────────────────────────────────

function speak(text, language = 'en-US') {
  Speech.stop();
  Speech.speak(text, {
    language,
    pitch: 1.0,
    rate: 0.9,
  });
}

const LANG_CODE = { English: 'en-US', Tagalog: 'fil-PH', Kapampangan: 'fil-PH' };

// Tagalog translations for common instructions
const TRANSLATIONS = {
  'Tagalog': {
    'Go straight':              'Diretso lang',
    'Bear right':               'Medyo kanan',
    'Turn right':               'Kumanan',
    'Make a sharp right turn':  'Matalas na kanan',
    'Bear left':                'Medyo kaliwa',
    'Turn left':                'Kumaliwa',
    'Make a sharp left turn':   'Matalas na kaliwa',
    'In {dist}, {instruction}': 'Sa {dist}, {instruction}',
    'You have arrived at your destination': 'Nakarating ka na sa iyong destinasyon',
    'Starting navigation':      'Nagsisimula ang nabigasyon',
    'Navigation stopped':       'Natapos ang nabigasyon',
    '{dist} remaining':         '{dist} na lang',
    'meters':                   'metro',
    'kilometers':               'kilometro',
  },
  'Kapampangan': {
    'Go straight':              'Diretso ka',
    'Bear right':               'Medyo kanan',
    'Turn right':               'Kumanan ka',
    'Make a sharp right turn':  'Matalas a kanan',
    'Bear left':                'Medyo kaliwa',
    'Turn left':                'Kumaliwa ka',
    'Make a sharp left turn':   'Matalas a kaliwa',
    'In {dist}, {instruction}': 'King {dist}, {instruction}',
    'You have arrived at your destination': 'Nakarating ka na king destinasyon mu',
    'Starting navigation':      'Magsisimula na ing nabigasyon',
    'Navigation stopped':       'Tapos na ing nabigasyon',
    '{dist} remaining':         '{dist} na lang',
    'meters':                   'metro',
    'kilometers':               'kilometro',
  },
};

function translate(text, language) {
  const map = TRANSLATIONS[language];
  if (!map) return text;
  return map[text] || text;
}

function formatDist(meters, language) {
  const unit = meters >= 1000
    ? `${(meters / 1000).toFixed(1)} ${translate('kilometers', language)}`
    : `${Math.round(meters)} ${translate('meters', language)}`;
  return unit;
}

function buildAnnouncement(template, vars, language) {
  let text = translate(template, language);
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const ARRIVAL_THRESHOLD   = 20;   // meters — announce arrival
const ANNOUNCE_NEAR       = 50;   // meters before waypoint — "Turn right"
const ANNOUNCE_PREPARE    = 200;  // meters before waypoint — "In 200m, turn right"
const LOCATION_INTERVAL   = 5;    // meters between location updates
const OFFROUTE_THRESHOLD  = 50;   // meters off route before warning

export function useVoiceNavigation({ language = 'English' } = {}) {
  const [isNavigating,  setIsNavigating]  = useState(false);
  const [instruction,   setInstruction]   = useState('');   // current displayed instruction
  const [distRemaining, setDistRemaining] = useState(0);
  const [arrived,       setArrived]       = useState(false);

  const routeRef      = useRef(null);   // full path array
  const waypointsRef  = useRef([]);     // derived waypoints
  const announcedRef  = useRef(new Set()); // keys of already-announced waypoints
  const locationSubRef = useRef(null);
  const langRef       = useRef(language);

  useEffect(() => { langRef.current = language; }, [language]);

  const announce = useCallback((text) => {
    const lang = langRef.current;
    const translated = translate(text, lang);
    setInstruction(translated);
    speak(translated, LANG_CODE[lang] || 'en-US');
  }, []);

  /** Start navigation along a given path (array of {latitude, longitude}) */
  const startNavigation = useCallback(async (path, destinationLabel = 'your destination') => {
    if (!path || path.length < 2) return;

    // Stop any existing navigation
    locationSubRef.current?.remove();
    Speech.stop();
    announcedRef.current = new Set();
    setArrived(false);

    routeRef.current     = path;
    waypointsRef.current = buildWaypoints(path);

    setIsNavigating(true);
    announce('Starting navigation');

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: LOCATION_INTERVAL },
      ({ coords }) => {
        const userPos = { latitude: coords.latitude, longitude: coords.longitude };
        const path    = routeRef.current;
        if (!path) return;

        const closestIdx = closestPointIndex(userPos, path);
        const remaining  = remainingDistance(path, closestIdx);
        setDistRemaining(remaining);

        // ── Arrival check ──────────────────────────────────────────────────
        if (remaining <= ARRIVAL_THRESHOLD) {
          if (!announcedRef.current.has('arrived')) {
            announcedRef.current.add('arrived');
            setArrived(true);
            announce(`You have arrived at your destination`);
            stopNavigation();
          }
          return;
        }

        // ── Waypoint announcements ─────────────────────────────────────────
        waypointsRef.current.forEach((wp) => {
          const distToWp = remainingDistance(path, closestIdx) -
            remainingDistance(path, wp.index);
          const absDistToWp = Math.abs(distToWp);

          // "In 200m, turn right" — preparation
          const prepKey = `prep-${wp.index}`;
          if (
            absDistToWp <= ANNOUNCE_PREPARE &&
            absDistToWp > ANNOUNCE_NEAR &&
            !announcedRef.current.has(prepKey)
          ) {
            announcedRef.current.add(prepKey);
            const dist = formatDist(absDistToWp, langRef.current);
            const msg  = buildAnnouncement(
              'In {dist}, {instruction}',
              { dist, instruction: translate(wp.instruction, langRef.current) },
              langRef.current
            );
            setInstruction(msg);
            speak(msg, LANG_CODE[langRef.current] || 'en-US');
          }

          // "Turn right now"
          const nowKey = `now-${wp.index}`;
          if (
            absDistToWp <= ANNOUNCE_NEAR &&
            !announcedRef.current.has(nowKey)
          ) {
            announcedRef.current.add(nowKey);
            announce(wp.instruction);
          }
        });

        // ── Distance remaining update (every ~100m) ────────────────────────
        const roundedRemaining = Math.round(remaining / 100) * 100;
        const distKey = `dist-${roundedRemaining}`;
        if (remaining > 300 && !announcedRef.current.has(distKey)) {
          announcedRef.current.add(distKey);
          const dist = formatDist(remaining, langRef.current);
          const msg  = buildAnnouncement('{dist} remaining', { dist }, langRef.current);
          setInstruction(msg);
          // Don't speak distance updates — just show on screen to avoid noise
        }
      }
    );
  }, [announce]);

  const stopNavigation = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    routeRef.current       = null;
    waypointsRef.current   = [];
    Speech.stop();
    setIsNavigating(false);
    setInstruction('');
    setDistRemaining(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopNavigation(), [stopNavigation]);

  return {
    isNavigating,
    instruction,
    distRemaining,
    arrived,
    startNavigation,
    stopNavigation,
    speak: announce,
  };
}
