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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMotionDetection } from '../hooks/useMotionDetection';
import { VoiceChat } from '../components/VoiceChat';
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
  const alertTranslate = useRef(new Animated.Value(-20)).current;
  const motionFlash = useRef(new Animated.Value(0)).current;

  const handleAlert = useCallback(
    (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
      setLatestAlert(alert);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(alertOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(alertTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(6000),
        Animated.parallel([
          Animated.timing(alertOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(alertTranslate, { toValue: -20, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    },
    [alertOpacity, alertTranslate]
  );

  const { isMotionDetected, isAnalyzing, triggerManualAnalysis } = useMotionDetection({
    cameraRef,
    settings,
    onAlert: handleAlert,
    enabled: isMonitoring,
  });

  // Flash effect on motion detection
  React.useEffect(() => {
    if (isMotionDetected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(motionFlash, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(motionFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [isMotionDetected, motionFlash]);

  const handleManualAnalyze = useCallback(async () => {
    const result = await triggerManualAnalysis('手動解析リクエスト');
    if (result?.anomalyDetected) {
      handleAlert({ id: Date.now().toString(), timestamp: new Date(), ...result });
    }
  }, [triggerManualAnalysis, handleAlert]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>カメラへのアクセスが必要です</Text>
          <Text style={styles.permissionDesc}>
            MIRAI.MAMORUが監視カメラとして機能するために、カメラへのアクセスを許可してください。
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>アクセスを許可する</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.permCancel}>キャンセル</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const monitorColor = isMonitoring
    ? isMotionDetected
      ? SEVERITY_COLORS.high
      : SEVERITY_COLORS.low
    : '#444';

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={settings.cameraType as CameraType}
      />

      {/* Motion flash overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.motionOverlay,
          { opacity: motionFlash },
        ]}
        pointerEvents="none"
      />

      {/* Top gradient + HUD */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="box-none"
      >
        <SafeAreaView>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>‹</Text>
            </Pressable>

            {/* Center status */}
            <View style={styles.statusCenter}>
              <View style={[styles.statusDot, { backgroundColor: monitorColor }]} />
              <Text style={styles.statusLabel}>
                {isAnalyzing
                  ? 'AI 解析中...'
                  : isMotionDetected
                  ? '動体検知'
                  : isMonitoring
                  ? '監視中'
                  : '待機中'}
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={styles.iconBtn}
            >
              <Text style={styles.iconBtnText2}>⚙</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Alert banner */}
      {latestAlert && (
        <Animated.View
          style={[
            styles.alertBanner,
            {
              opacity: alertOpacity,
              transform: [{ translateY: alertTranslate }],
              backgroundColor:
                latestAlert.severity === 'high'
                  ? '#ef444499'
                  : '#f59e0b99',
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.alertEmoji}>
            {latestAlert.severity === 'high' ? '🚨' : '⚡'}
          </Text>
          <View style={styles.alertTextBox}>
            <Text style={styles.alertTitle}>
              {latestAlert.severity === 'high' ? '警告' : '注意'}
            </Text>
            <Text style={styles.alertAction} numberOfLines={2}>
              {latestAlert.action}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Alert history chips */}
      {alerts.length > 0 && !chatVisible && (
        <View style={styles.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alerts.slice(0, 5).map((a) => (
              <View
                key={a.id}
                style={[styles.chip, { borderColor: SEVERITY_COLORS[a.severity] }]}
              >
                <View
                  style={[styles.chipDot, { backgroundColor: SEVERITY_COLORS[a.severity] }]}
                />
                <Text style={styles.chipTime}>
                  {a.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom gradient + controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.bottomGradient}
        pointerEvents="box-none"
      >
        <SafeAreaView>
          <View style={styles.controls}>
            {/* Analyze */}
            <Pressable
              onPress={handleManualAnalyze}
              disabled={isAnalyzing}
              style={[styles.sideBtn, isAnalyzing && styles.sideBtnDisabled]}
            >
              <Text style={styles.sideBtnIcon}>🔍</Text>
              <Text style={styles.sideBtnLabel}>解析</Text>
            </Pressable>

            {/* Main monitor button */}
            <Pressable
              onPress={() => setIsMonitoring((v) => !v)}
              style={styles.mainBtnWrapper}
            >
              <View
                style={[
                  styles.mainBtn,
                  isMonitoring && styles.mainBtnActive,
                ]}
              >
                <Text style={styles.mainBtnIcon}>{isMonitoring ? '⏹' : '▶'}</Text>
              </View>
              <Text style={styles.mainBtnLabel}>
                {isMonitoring ? '監視停止' : '監視開始'}
              </Text>
            </Pressable>

            {/* Voice chat */}
            <Pressable onPress={() => setChatVisible(true)} style={styles.sideBtn}>
              <Text style={styles.sideBtnIcon}>💬</Text>
              <Text style={styles.sideBtnLabel}>AIチャット</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

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

  motionOverlay: {
    backgroundColor: '#ef4444',
    opacity: 0,
  },

  // Permission screen
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  permissionEmoji: { fontSize: 64 },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  permBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permCancel: { color: '#6b7280', fontSize: 14, marginTop: 4 },

  // Top HUD
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 28, color: '#fff', marginTop: -2 },
  iconBtnText2: { fontSize: 18, color: '#fff' },
  statusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0009',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, color: '#fff', fontWeight: '600' },

  // Alert banner
  alertBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertEmoji: { fontSize: 28 },
  alertTextBox: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  alertAction: { fontSize: 13, color: '#ffe', lineHeight: 18 },

  // Chips
  chipsRow: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000a',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipTime: { fontSize: 12, color: '#e5e7eb', fontWeight: '600' },

  // Bottom controls
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingBottom: 8,
    paddingTop: 8,
  },
  sideBtn: { alignItems: 'center', gap: 5, minWidth: 60 },
  sideBtnDisabled: { opacity: 0.35 },
  sideBtnIcon: { fontSize: 26 },
  sideBtnLabel: { fontSize: 11, color: '#d1d5db', fontWeight: '500' },
  mainBtnWrapper: { alignItems: 'center', gap: 6 },
  mainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#374151',
  },
  mainBtnActive: {
    backgroundColor: '#ef4444',
    borderColor: '#fca5a5',
  },
  mainBtnIcon: { fontSize: 28 },
  mainBtnLabel: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: { height: '78%' },
});
