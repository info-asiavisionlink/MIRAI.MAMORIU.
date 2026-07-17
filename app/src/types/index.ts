export type Severity = 'low' | 'medium' | 'high';

export interface AnalysisResult {
  anomalyDetected: boolean;
  severity: Severity;
  description: string;
  action: string;
}

export interface MotionResult {
  motionDetected: boolean;
  changeRatio: number;
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: Severity;
  description: string;
  action: string;
  imageUri?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MonitoringSettings {
  motionSensitivity: number;       // 0.01 - 0.10
  analysisIntervalMs: number;      // 1000 - 5000
  notificationsEnabled: boolean;
  cameraType: 'front' | 'back';
  autoAnalyzeOnMotion: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Settings: undefined;
};
