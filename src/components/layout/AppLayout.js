import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children, navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <TopNav
        user={user}
        onMenuPress={() => setSidebarOpen(true)}
        onSettingsPress={() => navigation.navigate('Settings')}
      />
      <View style={styles.content}>{children}</View>
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
  content: { flex: 1 },
});
