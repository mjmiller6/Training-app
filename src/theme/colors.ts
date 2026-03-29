export const COLORS = {
  // Brand
  primary: '#FF6B35',
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',

  // Backgrounds
  background: '#1A1A2E',
  surface: '#16213E',
  surfaceElevated: '#1E2D4A',
  card: '#0F3460',

  // Text
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#607D8B',

  // Disciplines
  swim: '#00BCD4',
  swimLight: '#E0F7FA',
  bike: '#4CAF50',
  bikeLight: '#E8F5E9',
  run: '#FF5722',
  runLight: '#FBE9E7',
  brick: '#9C27B0',
  rest: '#607D8B',

  // Status
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // UI
  border: '#2C3E50',
  divider: '#1E2D4A',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
