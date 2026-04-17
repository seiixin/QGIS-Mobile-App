import React from 'react';
import { Text, View } from 'react-native';
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

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab icon ─────────────────────────────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
    <Text style={{ fontSize: 20 }}>{emoji}</Text>
    <Text style={{
      fontSize: 10, marginTop: 2,
      color: focused ? colors.tabActive : colors.tabInactive,
      fontWeight: focused ? '700' : '400',
    }}>
      {label}
    </Text>
  </View>
);

// ─── Bottom tabs (the 5 main content tabs) ────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen name="Impact" component={ImpactScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Impact" focused={focused} /> }} />
      <Tab.Screen name="Info" component={InfoScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="ℹ️" label="Info" focused={focused} /> }} />
      <Tab.Screen name="Map" component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="Map" focused={focused} /> }} />
      <Tab.Screen name="OfflineMap" component={OfflineMapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📥" label="Offlin" focused={focused} /> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🚨" label="Emergency" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ─── Main stack (tabs + sidebar destinations) ─────────────────────────────────
function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Dashboard" component={DashboardScreen} />
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
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
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
