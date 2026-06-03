import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../lib/useTheme';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
  icon?: string;
}

export default function ToggleRow({ label, description, value, onToggle, icon }: ToggleRowProps) {
  const { colors: t } = useTheme();

  return (
    <Pressable onPress={onToggle} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: t.accentBg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        {description ? <Text style={[styles.desc, { color: t.textMuted }]}>{description}</Text> : null}
      </View>
      <View style={[styles.track, { backgroundColor: value ? t.accent : t.surface2 }]}>
        <View style={[styles.thumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  desc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  track: {
    width: 44,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
