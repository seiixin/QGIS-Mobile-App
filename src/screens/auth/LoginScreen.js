import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#3B4FE0', '#6B7FFF', '#FFF9C4']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo + Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/smartquake-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>SmartQuake</Text>
            <Text style={styles.tagline}>Earthquake Preparedness App</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hello,{'\n'}Sign in!</Text>
            <Text style={styles.cardSubtitle}>Welcome back. Stay prepared.</Text>

            {/* Login field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or username"
                  placeholderTextColor={colors.textLight}
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.replace('Main')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3B4FE0', '#5B6FF5']}
                style={styles.signInGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.signInText}>SIGN IN</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  appName: {
    ...typography.h1,
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardTitle: {
    ...typography.h1,
    color: colors.textDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: 24,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: {
    ...typography.label,
    color: colors.textAccent,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.inputBorder,
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textDark,
    paddingVertical: 4,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: {
    ...typography.bodySmall,
    color: colors.textMid,
  },

  signInBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: colors.btnPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signInGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  signInText: {
    ...typography.button,
    color: colors.white,
    letterSpacing: 1.5,
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    ...typography.body,
    color: colors.textMid,
  },
  registerLink: {
    ...typography.body,
    color: colors.textDark,
    fontWeight: '700',
  },
});
