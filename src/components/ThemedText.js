/**
 * ThemedText — a Text component that automatically applies
 * font scaling from the user's settings and theme colors.
 *
 * Usage:
 *   <ThemedText variant="h3" color="primary">Hello</ThemedText>
 *   <ThemedText variant="body" color="secondary" style={styles.extra}>...</ThemedText>
 *
 * Variants: h1 h2 h3 h4 body bodySmall label button
 * Colors:   primary | secondary | muted | white | accent | danger | success
 */
import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { scaledTypography } from '../theme/typography';

export default function ThemedText({ variant = 'body', color = 'primary', style, children, ...props }) {
  const theme = useTheme();
  const t = scaledTypography(theme.fontScale);

  const colorMap = {
    primary:   theme.textPrimary,
    secondary: theme.textSecondary,
    muted:     theme.textMuted,
    white:     '#FFFFFF',
    accent:    theme.accent,
    danger:    theme.danger,
    success:   theme.success,
  };

  return (
    <Text style={[t[variant], { color: colorMap[color] ?? theme.textPrimary }, style]} {...props}>
      {children}
    </Text>
  );
}
