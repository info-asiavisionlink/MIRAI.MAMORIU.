import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const API_BASE_URL =
  extra.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3001';

export const DEFAULT_SETTINGS = {
  motionSensitivity: 0.04,
  analysisIntervalMs: 2000,
  notificationsEnabled: true,
  cameraType: 'back' as const,
  autoAnalyzeOnMotion: true,
};

export const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
} as const;

export const SEVERITY_LABELS = {
  low: '正常',
  medium: '注意',
  high: '警告',
} as const;
