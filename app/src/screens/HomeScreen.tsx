import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotifications } from '../hooks/useNotifications';
import { checkHealth } from '../services/api';
import { SEVERITY_COLORS } from '../constants/config';
import type { Alert, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const FEATURES = [
  { icon: '👶', label: '子育て\n支援', color: '#818cf8' },
  { icon: '🔒', label: '防犯\n監視', color: '#34d399' },
  { icon: '👴', label: '高齢者\n見守り', color: '#fb923c' },
  { icon: '🐕', label: 'ペット\n見守り', color: '#f472b6' },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [recentAlerts] = useState<Alert[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useNotifications();

  useEffect(() => {
    checkHealth().then(setServerOnline);

    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, pulseAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#1e1b4b', '#0a0a0a']}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.appName}>MIRAI.MAMORU</Text>
                <Text style={styles.tagline}>未来を守るAI見守りカメラ</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                style={styles.settingsBtn}
              >
                <Text style={styles.settingsIcon}>⚙</Text>
              </Pressable>
            </View>

            {/* Server status */}
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      serverOnline === null
                        ? '#f59e0b'
                        : serverOnline
                        ? '#22c55e'
                        : '#ef4444',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {serverOnline === null
                  ? 'サーバー確認中...'
                  : serverOnline
                  ? 'AI システム稼働中'
                  : 'サーバー未接続'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Main CTA */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={styles.startBtn}
            onPress={() => navigation.navigate('Camera')}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.startBtnGradient}
            >
              <Text style={styles.startIcon}>📷</Text>
              <Text style={styles.startLabel}>監視カメラを起動</Text>
              <Text style={styles.startSub}>タップして監視を開始する</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Server offline warning */}
        {serverOnline === false && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>バックエンドに接続できません</Text>
              <Text style={styles.warningDesc}>
                terminal で{' '}
                <Text style={styles.code}>cd backend && npm run dev</Text>{' '}
                を実行してください
              </Text>
            </View>
          </View>
        )}

        {/* Features */}
        <Text style={styles.sectionLabel}>見守り対象</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <Pressable
              key={f.label}
              style={styles.featureCard}
              onPress={() => navigation.navigate('Camera')}
            >
              <View style={[styles.featureIconBg, { backgroundColor: f.color + '22' }]}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Alerts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>最近のアラート</Text>
          {recentAlerts.length > 0 && (
            <Text style={styles.sectionCount}>{recentAlerts.length}件</Text>
          )}
        </View>

        {recentAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>異常は検知されていません</Text>
            <Text style={styles.emptyDesc}>監視を開始するとここにアラートが表示されます</Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {recentAlerts.map((alert) => (
              <View
                key={alert.id}
                style={[styles.alertItem, { borderLeftColor: SEVERITY_COLORS[alert.severity] }]}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: SEVERITY_COLORS[alert.severity] + '22' },
                    ]}
                  >
                    <Text
                      style={[styles.severityText, { color: SEVERITY_COLORS[alert.severity] }]}
                    >
                      {alert.severity === 'high' ? '警告' : alert.severity === 'medium' ? '注意' : '正常'}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>
                    {alert.timestamp.toLocaleString('ja-JP', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.alertAction}>{alert.action}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { gap: 16, paddingBottom: 48 },

  // Header
  header: { overflow: 'hidden' },
  headerGradient: { padding: 24, paddingTop: 16, gap: 16 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
  tagline: { fontSize: 13, color: '#818cf8', marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 20 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff0d',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, color: '#d1d5db' },

  // CTA
  startBtn: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 8 },
  startBtnGradient: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  startIcon: { fontSize: 48 },
  startLabel: { fontSize: 22, fontWeight: '800', color: '#fff' },
  startSub: { fontSize: 13, color: '#c7d2fe' },

  // Warning
  warningCard: {
    marginHorizontal: 20,
    backgroundColor: '#f59e0b11',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f59e0b44',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, gap: 4 },
  warningTitle: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },
  warningDesc: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  code: { fontFamily: 'monospace', backgroundColor: '#0004', color: '#fcd34d' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
  },
  sectionCount: { fontSize: 12, color: '#6366f1', fontWeight: '600' },

  // Features
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  featureIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 28 },
  featureLabel: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Alerts
  alertsList: { paddingHorizontal: 20, gap: 10 },
  alertItem: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    gap: 8,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: '700' },
  alertTime: { fontSize: 11, color: '#6b7280' },
  alertAction: { fontSize: 14, color: '#d1d5db', lineHeight: 20 },

  // Empty state
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#4b5563' },
  emptyDesc: { fontSize: 13, color: '#374151', textAlign: 'center', lineHeight: 20 },
});
