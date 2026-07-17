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
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Header */}
      <LinearGradient colors={['#111827', '#0a0a0a']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Camera */}
        <Section title="📷  カメラ">
          <Row label="カメラ選択" noBorder>
            <View style={styles.segControl}>
              {(['back', 'front'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => update('cameraType', type)}
                  style={[styles.segBtn, settings.cameraType === type && styles.segBtnActive]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      settings.cameraType === type && styles.segBtnTextActive,
                    ]}
                  >
                    {type === 'back' ? '🔙 背面' : '🤳 前面'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Row>
        </Section>

        {/* Motion Detection */}
        <Section title="👁  動体検知">
          <Row label="感度">
            <View style={styles.sliderWrapper}>
              <Text style={styles.sliderVal}>
                {(settings.motionSensitivity * 100).toFixed(0)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.01}
                maximumValue={0.15}
                step={0.01}
                value={settings.motionSensitivity}
                onValueChange={(v) => update('motionSensitivity', v)}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#374151"
                thumbTintColor="#6366f1"
              />
            </View>
          </Row>
          <Row label="解析間隔">
            <View style={styles.sliderWrapper}>
              <Text style={styles.sliderVal}>
                {(settings.analysisIntervalMs / 1000).toFixed(0)}秒
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1000}
                maximumValue={5000}
                step={500}
                value={settings.analysisIntervalMs}
                onValueChange={(v) => update('analysisIntervalMs', v)}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#374151"
                thumbTintColor="#6366f1"
              />
            </View>
          </Row>
          <Row label="動体検知時に自動解析" noBorder>
            <Switch
              value={settings.autoAnalyzeOnMotion}
              onValueChange={(v) => update('autoAnalyzeOnMotion', v)}
              trackColor={{ true: '#6366f1', false: '#374151' }}
              thumbColor={settings.autoAnalyzeOnMotion ? '#fff' : '#9ca3af'}
            />
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="🔔  通知">
          <Row label="プッシュ通知を有効にする" noBorder>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => update('notificationsEnabled', v)}
              trackColor={{ true: '#6366f1', false: '#374151' }}
              thumbColor={settings.notificationsEnabled ? '#fff' : '#9ca3af'}
            />
          </Row>
        </Section>

        {/* Sensitivity guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>感度の目安</Text>
          <View style={styles.guideRow}>
            <View style={[styles.guideDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.guideText}>低 (1〜2%) ：微細な動きも検知・誤報が多い</Text>
          </View>
          <View style={styles.guideRow}>
            <View style={[styles.guideDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.guideText}>中 (3〜5%) ：バランス重視・推奨設定</Text>
          </View>
          <View style={styles.guideRow}>
            <View style={[styles.guideDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.guideText}>高 (6%+) ：大きな動きのみ検知</Text>
          </View>
        </View>

        {/* App Info */}
        <Section title="ℹ  アプリ情報">
          <InfoRow label="バージョン" value="1.0.0 MVP" />
          <InfoRow label="AIモデル" value="Claude Sonnet 4.6" />
          <InfoRow label="動体検知エンジン" value="Pixel Diff (jimp)" />
          <InfoRow label="音声合成" value="expo-speech (ja-JP)" noBorder />
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

function Row({
  label,
  children,
  noBorder,
}: {
  label: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  noBorder,
}: {
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !noBorder && styles.rowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff0d',
  },
  backIcon: { fontSize: 30, color: '#fff', marginTop: -2 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Content
  content: { padding: 20, gap: 20, paddingBottom: 56 },

  // Section
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#141414',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  rowLabel: { fontSize: 15, color: '#e5e7eb', flex: 1 },

  // Slider
  sliderWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderVal: { fontSize: 14, color: '#6366f1', fontWeight: '700', width: 36 },
  slider: { flex: 1, height: 36 },

  // Segment control
  segControl: { flexDirection: 'row', gap: 6 },
  segBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1f2937',
  },
  segBtnActive: { backgroundColor: '#6366f1' },
  segBtnText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  segBtnTextActive: { color: '#fff', fontWeight: '700' },

  // Guide card
  guideCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 16,
    gap: 10,
  },
  guideTitle: { fontSize: 13, color: '#6b7280', fontWeight: '700' },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideDot: { width: 8, height: 8, borderRadius: 4 },
  guideText: { fontSize: 13, color: '#9ca3af', flex: 1 },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 15, color: '#9ca3af' },
  infoValue: { fontSize: 14, color: '#d1d5db', fontWeight: '500' },
});
