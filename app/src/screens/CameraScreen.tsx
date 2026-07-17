import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMotionDetection } from '../hooks/useMotionDetection';
import { VoiceChat } from '../components/VoiceChat';
import { StatusBadge } from '../components/StatusBadge';
import { DEFAULT_SETTINGS, SEVERITY_COLORS } from '../constants/config';
import type { Alert, MonitoringSettings, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

export function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [settings] = useState<MonitoringSettings>({ ...DEFAULT_SETTINGS });
  const alertOpacity = useRef(new Animated.Value(0)).current;

  const handleAlert = useCallback(
    (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
      setLatestAlert(alert);
      Animated.sequence([
        Animated.timing(alertOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(alertOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    },
    [alertOpacity]
  );

  const { isMotionDetected, isAnalyzing, triggerManualAnalysis } = useMotionDetection({
    cameraRef,
    settings,
    onAlert: handleAlert,
    enabled: isMonitoring,
  });

  const handleManualAnalyze = useCallback(async () => {
    const result = await triggerManualAnalysis('手動解析リクエスト');
    if (result?.anomalyDetected) {
      handleAlert({
        id: Date.now().toString(),
        timestamp: new Date(),
        ...result,
      });
    }
  }, [triggerManualAnalysis, handleAlert]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>カメラアクセスが必要です</Text>
          <Text style={styles.permissionDesc}>
            MIRAI.MAMORUは監視カメラとして機能するためカメラへのアクセスが必要です。
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>アクセスを許可する</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const motionBorderColor = isMotionDetected
    ? SEVERITY_COLORS.high
    : isMonitoring
    ? SEVERITY_COLORS.low
    : '#333';

  return (
    <View style={styles.container}>
      {/* Camera view */}
      <CameraView
        ref={cameraRef}
        style={[styles.camera, { borderColor: motionBorderColor }]}
        facing={settings.cameraType as CameraType}
      />

      {/* Motion indicator border */}
      {isMotionDetected && (
        <View style={[StyleSheet.absoluteFillObject, styles.motionBorder]} pointerEvents="none" />
      )}

      {/* Top HUD */}
      <SafeAreaView style={styles.topHud}>
        <View style={styles.hudRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <StatusBadge
            severity={isMotionDetected ? 'high' : isMonitoring ? 'low' : 'low'}
            label={
              isAnalyzing
                ? '解析中...'
                : isMotionDetected
                ? '動体検知'
                : isMonitoring
                ? '監視中'
                : '待機中'
            }
          />

          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Alert banner */}
      {latestAlert && (
        <Animated.View
          style={[
            styles.alertBanner,
            { opacity: alertOpacity, backgroundColor: SEVERITY_COLORS[latestAlert.severity] + 'cc' },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.alertTitle}>
            {latestAlert.severity === 'high' ? '⚠ 警告' : '⚡ 注意'}
          </Text>
          <Text style={styles.alertAction} numberOfLines={2}>
            {latestAlert.action}
          </Text>
        </Animated.View>
      )}

      {/* Recent alerts list */}
      {alerts.length > 0 && !chatVisible && (
        <View style={styles.alertsList}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alerts.slice(0, 5).map((a) => (
              <View key={a.id} style={[styles.alertChip, { borderColor: SEVERITY_COLORS[a.severity] }]}>
                <Text style={[styles.alertChipText, { color: SEVERITY_COLORS[a.severity] }]}>
                  {a.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.alertChipLabel} numberOfLines={1}>{a.action}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom controls */}
      <SafeAreaView style={styles.bottomHud}>
        <View style={styles.controls}>
          {/* Manual analyze button */}
          <Pressable
            onPress={handleManualAnalyze}
            disabled={isAnalyzing}
            style={[styles.controlBtn, isAnalyzing && styles.controlBtnDisabled]}
          >
            <Text style={styles.controlIcon}>🔍</Text>
            <Text style={styles.controlLabel}>解析</Text>
          </Pressable>

          {/* Start/Stop monitoring */}
          <Pressable
            onPress={() => setIsMonitoring((v) => !v)}
            style={[styles.monitorBtn, isMonitoring && styles.monitorBtnActive]}
          >
            <Text style={styles.monitorIcon}>{isMonitoring ? '⏹' : '▶'}</Text>
            <Text style={styles.monitorLabel}>{isMonitoring ? '監視停止' : '監視開始'}</Text>
          </Pressable>

          {/* Voice chat */}
          <Pressable onPress={() => setChatVisible(true)} style={styles.controlBtn}>
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>AIチャット</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Voice chat modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <VoiceChat onClose={() => setChatVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, borderWidth: 2, borderColor: 'transparent' },
  motionBorder: {
    borderWidth: 3,
    borderColor: SEVERITY_COLORS.high,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  permissionDesc: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  permBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 28, color: '#fff', fontWeight: '300' },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22, color: '#fff' },
  alertBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  alertAction: { fontSize: 14, color: '#ffe', lineHeight: 20 },
  alertsList: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  alertChip: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginRight: 8,
    minWidth: 100,
    maxWidth: 160,
  },
  alertChipText: { fontSize: 11, fontWeight: '700' },
  alertChipLabel: { fontSize: 11, color: '#ccc', marginTop: 2 },
  bottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 16,
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlBtnDisabled: { opacity: 0.4 },
  controlIcon: { fontSize: 24 },
  controlLabel: { fontSize: 11, color: '#ccc' },
  monitorBtn: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 4,
    minWidth: 100,
  },
  monitorBtnActive: { backgroundColor: '#ef4444' },
  monitorIcon: { fontSize: 22 },
  monitorLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: { height: '75%' },
});
