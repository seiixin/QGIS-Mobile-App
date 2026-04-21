// Base font sizes
const BASE = {
  h1:        { fontSize: 28, fontWeight: '700' },
  h2:        { fontSize: 22, fontWeight: '700' },
  h3:        { fontSize: 18, fontWeight: '600' },
  h4:        { fontSize: 16, fontWeight: '600' },
  body:      { fontSize: 14, fontWeight: '400' },
  bodySmall: { fontSize: 12, fontWeight: '400' },
  label:     { fontSize: 13, fontWeight: '500' },
  button:    { fontSize: 16, fontWeight: '700' },
};

// Static export — used by StyleSheet (no scaling)
export const typography = BASE;

// Scaled export — call with fontScale from ThemeContext
export function scaledTypography(scale = 1.0) {
  const s = {};
  Object.entries(BASE).forEach(([key, val]) => {
    s[key] = { ...val, fontSize: Math.round(val.fontSize * scale) };
  });
  return s;
}
