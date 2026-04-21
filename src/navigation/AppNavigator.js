import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import DashboardScreen from '../screens/main/DashboardScreen';
import ImpactScreen from '../screens/main/ImpactScreen';
import InfoScreen from '../screens/main/InfoScreen';
import MapScreen from '../screens/main/MapScreen';
import OfflineMapScreen from '../screens/main/OfflineMapScreen';
import EmergencyScreen from '../screens/main/EmergencyScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const NAV_COLOR = '#1B2A4A';

// ─── Icon map per tab ─────────────────────────────────────────────────────────
const TAB_ICONS = {
  Impact:     { active: 'bar-chart',          inactive: 'bar-chart-outline'          },
  Info:       { active: 'information-circle', inactive: 'information-circle-outline' },
  Map:        { active: 'map',                inactive: 'map-outline'                },
  OfflineMap: { active: 'download',           inactive: 'download-outline'           },
  Emergency:  { active: 'call',               inactive: 'call-outline'               },
};

const TabIcon = ({ name, label, focused }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.88)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0.88,
      useNativeDriver: true,
      tension: 80, friction: 8,
    }).start();
  }, [focused]);

  const iconName = focused ? TAB_ICONS[name]?.active : TAB_ICONS[name]?.inactive;

  return (
    <Animated.View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2, transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Ionicons name={iconName} size={22} color={focused ? '#FFFFFF' : 'rgba(255,255,255,0.45)'} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </Animated.View>
  );
};

// ─── Bottom tabs (5 content tabs) ─────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1B2A4A',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen name="Impact" component={ImpactScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Impact" label="Impact" focused={focused} /> }} />
      <Tab.Screen name="Info" component={InfoScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Info" label="Info" focused={focused} /> }} />
      <Tab.Screen name="Map" component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Map" label="Map" focused={focused} /> }} />
      <Tab.Screen name="OfflineMap" component={OfflineMapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="OfflineMap" label="Offline" focused={focused} /> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Emergency" label="Emergency" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ─── Main stack — tabs + sidebar-only screens ─────────────────────────────────
function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Dashboard" component={DashboardScreen} />
      <MainStack.Screen name="Tabs"      component={MainTabs} />
      <MainStack.Screen name="Profile"   component={ProfileScreen} />
      <MainStack.Screen name="Settings"  component={SettingsScreen} />
    </MainStack.Navigator>
  );
}

// ─── Auth stack ───────────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        {isAuthenticated ? <RootStack.Screen name="Main" component={MainNavigator} /> : null}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 36, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabLabel: { fontSize: 10, marginTop: 2, color: 'rgba(255,255,255,0.45)' },
  tabLabelActive: { color: '#FFFFFF', fontWeight: '700' },
});
