import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../lib/useTheme';

interface InputProps extends TextInputProps { label?: string; error?: string; }

export default function Input({ label, error, style, ...rest }: InputProps) {
  const { colors: t } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text> : null}
      <TextInput style={[styles.input, { backgroundColor: t.surface, borderColor: error ? t.error : t.border, color: t.text }, style]} placeholderTextColor={t.textGrey} selectionColor={t.accent} {...rest} />
      {error ? <Text style={[styles.error, { color: t.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontFamily: 'DMSans-Medium', fontSize: 13, marginBottom: 8, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, paddingHorizontal: 16, fontFamily: 'DMSans-Regular', fontSize: 15 },
  error: { fontFamily: 'DMSans-Regular', fontSize: 12, marginTop: 6 },
});
