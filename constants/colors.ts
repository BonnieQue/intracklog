export type ThemeColors = typeof darkColors;

export const darkColors = {
  bg: '#0a0a0c',
  surface: '#131318',
  surface2: '#1a1a22',
  accent: '#52AD3B',
  accentDim: '#469332',
  accentBg: 'rgba(82,173,59,0.08)',
  accentBorder: 'rgba(82,173,59,0.15)',
  secondary: '#E07A3A',
  secondaryDim: '#c96a30',
  secondaryBg: 'rgba(224,122,58,0.08)',
  secondaryBorder: 'rgba(224,122,58,0.15)',
  text: '#f0efe8',
  textMuted: '#8a8a96',
  textGrey: '#6a6a76',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  success: '#52AD3B',
  warning: '#E07A3A',
  error: '#E05A5A',
  info: '#85B7EB',
};

export const lightColors: ThemeColors = {
  bg: '#ffffff',
  surface: '#f5f5f7',
  surface2: '#eaeaee',
  accent: '#52AD3B',
  accentDim: '#469332',
  accentBg: 'rgba(82,173,59,0.08)',
  accentBorder: 'rgba(82,173,59,0.15)',
  secondary: '#E07A3A',
  secondaryDim: '#c96a30',
  secondaryBg: 'rgba(224,122,58,0.08)',
  secondaryBorder: 'rgba(224,122,58,0.15)',
  text: '#1a1a1f',
  textMuted: '#5a5a66',
  textGrey: '#8a8a96',
  border: 'rgba(0,0,0,0.08)',
  borderHover: 'rgba(0,0,0,0.15)',
  success: '#52AD3B',
  warning: '#E07A3A',
  error: '#E05A5A',
  info: '#85B7EB',
};

// Default export for static imports
export const colors = darkColors;

export const vehicleColors = [
  { key: 'green', tint: 'rgba(82,173,59,0.10)', solid: '#52AD3B' },
  { key: 'orange', tint: 'rgba(224,122,58,0.10)', solid: '#E07A3A' },
  { key: 'blue', tint: 'rgba(133,183,235,0.10)', solid: '#85B7EB' },
  { key: 'purple', tint: 'rgba(175,169,236,0.10)', solid: '#AFA9EC' },
  { key: 'teal', tint: 'rgba(93,202,165,0.10)', solid: '#5DCAA5' },
] as const;

export type VehicleColorKey = (typeof vehicleColors)[number]['key'];
