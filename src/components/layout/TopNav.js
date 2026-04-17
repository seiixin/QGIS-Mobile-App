import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function TopNav({ onMenuPress, onSettingsPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
        <View style={styles.menuLine} />
        <View style={[styles.menuLine, { width: 18 }]} />
        <View style={styles.menuLine} />
      </TouchableOpacity>

      <View style={styles.logoRow}>
        <Image
          source={require('../../../assets/smartquake-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>SmartQuake</Text>
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  menuLine: {
    width: 22,
    height: 2,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  logoText: {
    ...typography.h3,
    color: colors.white,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 20 },
});
