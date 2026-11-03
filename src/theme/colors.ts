export const colors = {
  // Brand colors
  brand: {
    primary: '#0F172A', // Slate 900
    primaryLight: '#1E293B',
    accent: '#2563EB', // Vibrant Blue
    accentHover: '#1D4ED8',
    highlight: '#10B981', // Emerald health plus accent
  },
  // Backgrounds
  background: {
    default: '#F8FAFC',
    card: '#FFFFFF',
    elevated: '#F1F5F9',
    dark: '#0F172A',
  },
  // Typography
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
    brand: '#2563EB',
  },
  // Borders
  border: {
    light: '#E2E8F0',
    default: '#CBD5E1',
    focused: '#2563EB',
  },
  // Status & Feedback
  status: {
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FCA5A5',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    warningBorder: '#FCD34D',
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#6EE7B7',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    infoBorder: '#93C5FD',
  },
} as const;

export type Colors = typeof colors;
