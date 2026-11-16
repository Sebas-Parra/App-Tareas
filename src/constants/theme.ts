export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#4F46E5',
    primarySoft: '#EEF2FF',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    success: '#16A34A',
    warning: '#D97706',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0B0B0F',
    card: '#17171C',
    border: '#2A2A31',
    primary: '#818CF8',
    primarySoft: '#1E1B4B',
    onPrimary: '#0B0B0F',
    danger: '#F87171',
    dangerSoft: '#2A1215',
    success: '#4ADE80',
    warning: '#FBBF24',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;
