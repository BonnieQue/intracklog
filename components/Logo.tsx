import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../lib/useTheme';

type LogoSize = 'sm' | 'md' | 'lg';
const SCALE: Record<LogoSize, number> = { sm: 0.7, md: 1, lg: 1.3 };

// Pin mark intrinsic dimensions (assets/logo-mark.png is 430×676)
const MARK_ASPECT = 430 / 676;

export function LogoIcon({ size = 60 }: { size?: number }) {
  // Preserve the old logo's vertical footprint (height was size * 1.14).
  // Both dimensions are explicit so a parent's default alignItems:'stretch'
  // can't force the image to fill the screen.
  const height = size * 1.14 * 0.82;
  const width = height * MARK_ASPECT;
  return (
    <Image
      source={require('../assets/logo-mark.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}

export function LogoFull({ size = 'md' }: { size?: LogoSize }) {
  const { colors: t } = useTheme();
  const s = SCALE[size];
  return (
    <View style={styles.fullWrap}>
      <LogoIcon size={60 * s} />
      <View>
        <View style={styles.nameRow}>
          <Text style={[styles.nameBold, { fontSize: 28 * s, color: t.textGrey }]}>In</Text>
          <Text style={[styles.nameBold, { fontSize: 28 * s, color: t.accent }]}>Track</Text>
          <Text style={[styles.nameLight, { fontSize: 28 * s, color: t.secondary }]}>Log</Text>
        </View>
        <Text style={[styles.tagline, { fontSize: 9 * s, letterSpacing: 2 * s, color: t.textMuted }]}>DRIVE FORWARD. TRACK SMART.</Text>
      </View>
    </View>
  );
}

export function LogoCompact() {
  const { colors: t } = useTheme();
  return (
    <View style={styles.compactWrap}>
      <LogoIcon size={50} />
      <View style={styles.nameRow}>
        <Text style={[styles.nameBold, { fontSize: 30, color: t.textGrey }]}>In</Text>
        <Text style={[styles.nameBold, { fontSize: 30, color: t.accent }]}>Track</Text>
        <Text style={[styles.nameLight, { fontSize: 30, color: t.secondary }]}>Log</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  nameBold: { fontFamily: 'DMSans-Bold' },
  nameLight: { fontFamily: 'DMSans-Regular' },
  tagline: { fontFamily: 'DMSans-Regular', marginTop: 2 },
});
