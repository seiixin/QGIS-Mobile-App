/**
 * activityStore.js
 * Lightweight AsyncStorage log for recent user activity.
 * Stores up to MAX_EVENTS entries, newest first.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recent_activity_log';
const MAX_EVENTS  = 20;

/**
 * Append a new activity event.
 * @param {{ type: string, label: string, sub: string }} event
 */
export async function logActivity(event) {
  try {
    const raw      = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const entry    = { ...event, ts: Date.now() };
    const updated  = [entry, ...existing].slice(0, MAX_EVENTS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('activityStore.logActivity error:', e.message);
  }
}

/**
 * Read the most recent N activity events.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentActivity(limit = 5) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.slice(0, limit);
  } catch {
    return [];
  }
}

/** Format a timestamp into a relative label like "2m ago", "1h ago", "Just now" */
export function formatRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000); // seconds
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
