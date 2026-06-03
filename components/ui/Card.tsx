import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../lib/useTheme';

export default function Card({ children, style, ...rest }: ViewProps) {
  const { colors: t } = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 32 },
});
