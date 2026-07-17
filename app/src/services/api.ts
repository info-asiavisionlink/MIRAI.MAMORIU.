import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import type { AnalysisResult, MotionResult } from '../types';

const http = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

export async function checkHealth(): Promise<boolean> {
  try {
    await http.get('/api/health');
    return true;
  } catch {
    return false;
  }
}

export async function detectMotion(
  previousFrame: string,
  currentFrame: string
): Promise<MotionResult> {
  const { data } = await http.post<MotionResult>('/api/analyze/motion', {
    previousFrame,
    currentFrame,
  });
  return data;
}

export async function analyzeImage(
  imageBase64: string,
  context?: string
): Promise<AnalysisResult> {
  const { data } = await http.post<AnalysisResult>('/api/analyze/image', {
    imageBase64,
    context,
  });
  return data;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const { data } = await http.post<{ response: string }>('/api/chat', {
    message,
    history,
  });
  return data.response;
}
