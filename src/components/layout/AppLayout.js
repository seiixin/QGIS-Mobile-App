import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Screens that live in the MainStack (not inside the Tab navigator)
// — they need a custom bottom bar so it stays visible
const STACK_SCREENS = ['Dashboard', 'Profile', 'Settings'];

const TAB_ITEMS = [
  { name: 'Impact',     label: 'Impact',   icon: 'bar-chart-outline',          iconActive: 'bar-chart'           },
  { name: 'Info',       label: 'Info',     icon: 'information-circle-outline', iconActive: 'information-circle'  },
  { name: 'Map',        label: 'Map',      icon: 'map-outline',                iconActive: 'map'                 },
  { name: 'OfflineMap', label: 'Offline',  icon: 'download-outline',           iconActive: 'download'            },
  { name: 'Emergency',  label: 'Emergency',icon: 'call-outline',               iconActive: 'call'                },
];

function StackBottomBar({ navigation }) {
  return (
    <View style={barStyles.bar}>
      {TAB_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={barStyles.item}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Tabs', { screen: item.name })}
        >
          <View style={barStyles.iconWrap}>
            <Ionicons name={item.icon} size={22} color="rgba(255,255,255,0.45)" />
          </View>
          <Text style={barStyles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AppLayout({ children, navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const theme = useTheme();

  // Detect if we're on a stack screen (Dashboard / Profile / Settings)
  const routeName = useNavigationState((state) => {
    if (!state) return null;
    // Walk down to the active leaf route name
    let s = state;
    while (s?.routes?.[s.index]?.state) {
      s = s.routes[s.index].state;
    }
    return s?.routes?.[s.index]?.name ?? null;
  });

  const showCustomBar = STACK_SCREENS.includes(routeName);

  return (
    <View style={styles.container}>
      <TopNav
        user={user}
        onMenuPress={() => setSidebarOpen(true)}
        onSettingsPress={() => navigation.navigate('Settings')}
      />
      <View style={[styles.content, { backgroundColor: theme.bg }]}>{children}</View>

      {/* Custom bottom bar for stack screens */}
      {showCustomBar && <StackBottomBar navigation={navigation} />}

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        user={user}
        onLogout={signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1 },
});

const barStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#1B2A4A',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36, height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    color: 'rgba(255,255,255,0.45)',
  },
});
