import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function TopNav({ onMenuPress, onSettingsPress, user }) {
  const { isOnline } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
        <View style={styles.menuLine} />
        <View style={[styles.menuLine, { width: 18 }]} />
        <View style={styles.menuLine} />
      </TouchableOpacity>

      <View style={styles.logoRow}>
        <View>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/smartquake-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>SmartQuake</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#27AE60' : '#E74C3C' }]} />
            <Text style={styles.userText}>
              {user?.name || 'Guest session'}
              {'  '}
              <Text style={[styles.statusText, { color: isOnline ? '#2ECC71' : '#E74C3C' }]}>
                {isOnline ? '● Online' : '● Offline'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.settingsBtn} onPress={onSettingsPress} activeOpacity={0.7}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 14,
  },
  menuBtn: {
    width: 36, height: 36,
    justifyContent: 'center', gap: 5,
  },
  menuLine: {
    width: 22, height: 2,
    backgroundColor: colors.white, borderRadius: 2,
  },
  logoRow: {},
  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  logo: { width: 28, height: 28 },
  logoText: { ...typography.h3, color: colors.white, letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  userText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)' },
  statusText: { fontSize: 10, fontWeight: '700' },
  settingsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 20 },
});
