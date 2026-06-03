import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { LogoFull } from '../components/Logo';
import { useTheme } from '../lib/useTheme';

export default function PaymentCancelScreen() {
  const router = useRouter();
  const { colors: t } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.content}>
        <LogoFull size="md" />
        <View style={[styles.iconWrap, { backgroundColor: t.secondaryBg, borderColor: t.secondary }]}>
          <Text style={[styles.cross, { color: t.secondary }]}>×</Text>
        </View>
        <Text style={[styles.title, { color: t.text }]}>Payment cancelled</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>
          No worries — your account hasn't been charged. You can try again anytime.
        </Text>
        <View style={{ marginTop: 32, width: '100%', maxWidth: 280, gap: 10 }}>
          <Button title="Back to dashboard" onPress={() => router.replace('/(main)/dashboard')} />
          <Button title="Try again" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  cross: { fontSize: 56, fontFamily: 'DMSans-Bold', lineHeight: 64 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, textAlign: 'center', letterSpacing: -0.5, marginTop: 8 },
  subtitle: { fontFamily: 'DMSans-Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
});
