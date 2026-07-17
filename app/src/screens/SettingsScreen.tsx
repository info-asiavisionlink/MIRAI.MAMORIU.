import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { DEFAULT_SETTINGS } from '../constants/config';
import type { MonitoringSettings } from '../types';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<MonitoringSettings>({ ...DEFAULT_SETTINGS });

  const update = <K extends keyof MonitoringSettings>(key: K, value: MonitoringSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Camera */}
        <Section title="カメラ">
          <Row label="カメラ選択">
            <View style={styles.segControl}>
              {(['back', 'front'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => update('cameraType', type)}
                  style={[
                    styles.segBtn,
                    settings.cameraType === type && styles.segBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      settings.cameraType === type && styles.segBtnTextActive,
                    ]}
                  >
                    {type === 'back' ? '背面' : '前面'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Row>
        </Section>

        {/* Motion Detection */}
        <Section title="動体検知">
          <Row label={`感度  ${(settings.motionSensitivity * 100).toFixed(0)}%`}>
            <Slider
              style={styles.slider}
              minimumValue={0.01}
              maximumValue={0.15}
              step={0.01}
              value={settings.motionSensitivity}
              onValueChange={(v) => update('motionSensitivity', v)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#333"
              thumbTintColor="#6366f1"
            />
          </Row>
          <Row label={`解析間隔  ${(settings.analysisIntervalMs / 1000).toFixed(0)}秒`}>
            <Slider
              style={styles.slider}
              minimumValue={1000}
              maximumValue={5000}
              step={500}
              value={settings.analysisIntervalMs}
              onValueChange={(v) => update('analysisIntervalMs', v)}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#333"
              thumbTintColor="#6366f1"
            />
          </Row>
          <Row label="動体検知時に自動解析">
            <Switch
              value={settings.autoAnalyzeOnMotion}
              onValueChange={(v) => update('autoAnalyzeOnMotion', v)}
              trackColor={{ true: '#6366f1', false: '#333' }}
            />
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="通知">
          <Row label="プッシュ通知">
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => update('notificationsEnabled', v)}
              trackColor={{ true: '#6366f1', false: '#333' }}
            />
          </Row>
        </Section>

        {/* Info */}
        <Section title="アプリ情報">
          <View style={styles.infoBox}>
            <InfoRow label="バージョン" value="1.0.0 MVP" />
            <InfoRow label="AIモデル" value="Claude Sonnet 4.6" />
            <InfoRow label="動体検知" value="ピクセル差分法" />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backIcon: { fontSize: 32, color: '#fff', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 24, paddingBottom: 48 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    gap: 12,
  },
  rowLabel: { fontSize: 15, color: '#e0e0e0', flex: 1 },
  slider: { flex: 1, height: 40 },
  segControl: { flexDirection: 'row', gap: 4 },
  segBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  segBtnActive: { backgroundColor: '#6366f1' },
  segBtnText: { fontSize: 13, color: '#888' },
  segBtnTextActive: { color: '#fff', fontWeight: '600' },
  infoBox: { paddingVertical: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#ccc' },
});
