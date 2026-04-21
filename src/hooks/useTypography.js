import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { scaledTypography } from '../theme/typography';

/**
 * Returns typography styles scaled by the user's font size setting.
 * Usage: const t = useTypography();  then  style={t.h3}
 */
export function useTypography() {
  const { fontScale } = useTheme();
  return useMemo(() => scaledTypography(fontScale), [fontScale]);
}
