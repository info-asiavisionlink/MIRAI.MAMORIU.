import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../constants/config';
import type { Severity } from '../types';

interface Props {
  severity: Severity;
  label?: string;
}

export function StatusBadge({ severity, label }: Props) {
  const color = SEVERITY_COLORS[severity];
  const text = label ?? SEVERITY_LABELS[severity];

  return (
    <View style={[styles.badge, { backgroundColor: color + '33', borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
