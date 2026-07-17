import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBadge } from '../components/StatusBadge';
import { useNotifications } from '../hooks/useNotifications';
import { checkHealth } from '../services/api';
import { SEVERITY_COLORS } from '../constants/config';
import type { Alert, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [recentAlerts] = useState<Alert[]>([]);
  useNotifications();

  useEffect(() => {
    checkHealth().then(setServerOnline);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>MIRAI.MAMORU</Text>
            <Text style={styles.tagline}>未来を守るAI見守りカメラ</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* Server status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>システム状態</Text>
          <View style={styles.statusRow}>
            <StatusBadge
              severity={serverOnline === null ? 'medium' : serverOnline ? 'low' : 'high'}
              label={
                serverOnline === null ? '確認中...' : serverOnline ? 'サーバー接続済み' : 'サーバー未接続'
              }
            />
          </View>
          {serverOnline === false && (
            <Text style={styles.serverWarning}>
              バックエンドサーバーが起動していません。{'\n'}
              backend/ ディレクトリで `npm run dev` を実行してください。
            </Text>
          )}
        </View>

        {/* Feature cards */}
        <Text style={styles.sectionTitle}>見守り対象</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Start monitoring */}
        <Pressable
          style={styles.startBtn}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.startIcon}>📷</Text>
          <Text style={styles.startLabel}>監視カメラを起動</Text>
          <Text style={styles.startSub}>タップして開始</Text>
        </Pressable>

        {/* Recent alerts */}
        <Text style={styles.sectionTitle}>最近の通知</Text>
        {recentAlerts.length === 0 ? (
          <View style={styles.emptyAlerts}>
            <Text style={styles.emptyAlertsIcon}>🛡</Text>
            <Text style={styles.emptyAlertsText}>異常は検知されていません</Text>
          </View>
        ) : (
          recentAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[styles.alertItem, { borderLeftColor: SEVERITY_COLORS[alert.severity] }]}
            >
              <Text style={styles.alertTime}>
                {alert.timestamp.toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.alertAction}>{alert.action}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '👶', label: '子育て支援' },
  { icon: '🔒', label: '防犯監視' },
  { icon: '👴', label: '高齢者見守り' },
  { icon: '🐕', label: 'ペット見守り' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: '#888', marginTop: 2 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 24, color: '#666' },
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 13, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row' },
  serverWarning: {
    fontSize: 12,
    color: '#f59e0b',
    lineHeight: 18,
    backgroundColor: '#f59e0b11',
    padding: 10,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 13, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: { fontSize: 32 },
  featureLabel: { fontSize: 13, color: '#ccc', fontWeight: '600', textAlign: 'center' },
  startBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  startIcon: { fontSize: 40 },
  startLabel: { fontSize: 20, fontWeight: '700', color: '#fff' },
  startSub: { fontSize: 13, color: '#c7d2fe' },
  emptyAlerts: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyAlertsIcon: { fontSize: 36 },
  emptyAlertsText: { fontSize: 14, color: '#555' },
  alertItem: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    gap: 4,
  },
  alertTime: { fontSize: 11, color: '#666' },
  alertAction: { fontSize: 14, color: '#ccc', lineHeight: 20 },
});
