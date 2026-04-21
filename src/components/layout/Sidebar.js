import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TouchableWithoutFeedback, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.72;

const menuItems = [
  { icon: 'home',          label: 'Dashboard', screen: 'Dashboard' },
  { icon: 'settings',      label: 'Settings',  screen: 'Settings'  },
  { icon: 'person-circle', label: 'Profile',   screen: 'Profile'   },
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

  const handleNavigate = (screen) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 260);
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

        {/* Menu items */}
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={22} color={colors.white} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              onClose();
              await onLogout();
              setTimeout(() => navigation.replace('Auth'), 260);
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

  menuList: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 16,
    marginBottom: 4,
  },
  menuItemLabel: { ...typography.h4, color: colors.white },

  drawerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
