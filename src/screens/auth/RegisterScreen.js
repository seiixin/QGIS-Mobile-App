import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Your{'\n'}Account</Text>
            <Text style={styles.cardSubtitle}>Join SmartQuake and stay prepared.</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="johndoe"
                  placeholderTextColor={colors.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up button */}
            <TouchableOpacity
              style={styles.signUpBtn}
              onPress={() => navigation.replace('Main')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3B4FE0', '#5B6FF5']}
                style={styles.signUpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.signUpText}>SIGN UP</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign In</Text>
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

  signUpBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    elevation: 4,
    shadowColor: colors.btnPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signUpGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  signUpText: {
    ...typography.button,
    color: colors.white,
    letterSpacing: 1.5,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    ...typography.body,
    color: colors.textMid,
  },
  loginLink: {
    ...typography.body,
    color: colors.textDark,
    fontWeight: '700',
  },
});
