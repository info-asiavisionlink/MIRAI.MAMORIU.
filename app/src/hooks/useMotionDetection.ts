import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { detectMotion, analyzeImage } from '../services/api';
import { sendLocalAlert } from '../services/notificationService';
import type { Alert, AnalysisResult, MonitoringSettings } from '../types';

interface UseMotionDetectionOptions {
  cameraRef: React.RefObject<CameraView>;
  settings: MonitoringSettings;
  onAlert: (alert: Alert) => void;
  enabled: boolean;
}

export function useMotionDetection({
  cameraRef,
  settings,
  onAlert,
  enabled,
}: UseMotionDetectionOptions) {
  const [isMotionDetected, setIsMotionDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previousFrameRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyzeThrottleRef = useRef(false);

  const captureAndDetect = useCallback(async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      // Capture low-quality thumbnail for motion detection
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.05,
        skipProcessing: true,
      });

      if (!photo?.base64) return;

      // Resize to 64x64 for bandwidth efficiency
      const thumb = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 64, height: 64 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.3 }
      );

      const currentFrame = thumb.base64!;
      const prev = previousFrameRef.current;
      previousFrameRef.current = currentFrame;

      if (!prev) return;

      const { motionDetected, changeRatio } = await detectMotion(prev, currentFrame);
      setIsMotionDetected(motionDetected);

      if (
        motionDetected &&
        settings.autoAnalyzeOnMotion &&
        !analyzeThrottleRef.current
      ) {
        analyzeThrottleRef.current = true;
        setTimeout(() => { analyzeThrottleRef.current = false; }, 10000);

        setIsAnalyzing(true);
        try {
          const highRes = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.7,
          });

          if (!highRes?.base64) return;

          const result: AnalysisResult = await analyzeImage(
            highRes.base64,
            `動体検知(変化率: ${(changeRatio * 100).toFixed(1)}%)`
          );

          if (result.anomalyDetected) {
            const alert: Alert = {
              id: Date.now().toString(),
              timestamp: new Date(),
              severity: result.severity,
              description: result.description,
              action: result.action,
              imageUri: highRes.uri,
            };
            onAlert(alert);

            if (settings.notificationsEnabled) {
              await sendLocalAlert(result.severity, result.description, result.action);
            }
          }
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (err) {
      console.warn('[motionDetection]', err);
    }
  }, [cameraRef, settings, onAlert, isAnalyzing]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsMotionDetected(false);
      return;
    }

    intervalRef.current = setInterval(captureAndDetect, settings.analysisIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, settings.analysisIntervalMs, captureAndDetect]);

  const triggerManualAnalysis = useCallback(
    async (context?: string): Promise<AnalysisResult | null> => {
      if (!cameraRef.current) return null;
      setIsAnalyzing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        if (!photo?.base64) return null;
        return await analyzeImage(photo.base64, context ?? '手動解析');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [cameraRef]
  );

  return { isMotionDetected, isAnalyzing, triggerManualAnalysis };
}
