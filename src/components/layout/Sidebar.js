import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TouchableWithoutFeedback, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.72;

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { icon: 'home-outline', label: 'Dashboard', screen: 'Dashboard' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'person-circle-outline', label: 'Profile',  screen: 'Profile'  },
      { icon: 'settings-outline',      label: 'Settings', screen: 'Settings' },
    ],
  },
];

export default function Sidebar({ visible, onClose, navigation, user, onLogout }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (screen, tab) => {
    onClose();
    setTimeout(() => {
      if (tab) {
        navigation.navigate(screen, { screen: tab });
      } else {
        navigation.navigate(screen);
      }
    }, 260);
  };

  if (!visible && slideAnim._value === -SIDEBAR_WIDTH) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Image
            source={require('../../../assets/smartquake-logo.png')}
            style={styles.drawerLogo}
            resizeMode="contain"
          />
          <Text style={styles.drawerAppName}>SmartQuake</Text>
          <Text style={styles.drawerTagline}>
            {user?.email || 'Dashboard, settings, and quick navigation.'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Nav sections */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {NAV_SECTIONS.map((section, si) => (
            <View key={section.title}>
              {si > 0 && <View style={styles.sectionDivider} />}
              <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.screen, item.tab)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon} size={20} color="rgba(255,255,255,0.85)" />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              onClose();
              await onLogout();
              setTimeout(() => navigation.navigate('Auth'), 260);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1B2A4A',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 56,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    flexDirection: 'column',
  },

  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  drawerLogo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  drawerAppName: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 4,
  },
  drawerTagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 0,
  },

  menuScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 14,
    marginBottom: 2,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: { ...typography.h4, color: colors.white, fontWeight: '500' },

  drawerFooter: {
    paddingBottom: 32,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C0392B',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
  },
  logoutIcon: { fontSize: 18, color: colors.white },
  logoutText: {
    ...typography.button,
    color: colors.white,
  },
});
