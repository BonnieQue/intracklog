import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/useTheme';

interface ButtonProps { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'orange' | 'danger'; loading?: boolean; disabled?: boolean; fullWidth?: boolean; style?: ViewStyle; }

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, fullWidth = false, style }: ButtonProps) {
  const { colors: t } = useTheme();
  const isPrimary = variant === 'primary';
  const isOrange = variant === 'orange';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const bgColor = isPrimary ? t.accent : isOrange ? t.secondary : isDanger ? t.error : isSecondary ? t.surface : 'transparent';
  const textColor = isPrimary || isOrange || isDanger ? '#ffffff' : isSecondary ? t.text : t.textMuted;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      style={[styles.base, { backgroundColor: disabled ? t.surface2 : bgColor, borderWidth: isSecondary ? 1 : 0, borderColor: t.borderHover, opacity: disabled ? 0.5 : 1 }, fullWidth && { width: '100%' }, style]}>
      {loading ? <ActivityIndicator color={textColor} size="small" /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 50, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'DMSans-Bold', fontSize: 16, letterSpacing: -0.2 },
});
