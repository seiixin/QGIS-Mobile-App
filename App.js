import 'react-native-gesture-handler';
import React from 'react';
import { View, StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function ThemedRoot() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.navBg }}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'light-content'}
        backgroundColor={theme.navBg}
      />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </AuthProvider>
  );
}
