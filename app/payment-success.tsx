import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { LogoFull } from '../components/Logo';
import { useTheme } from '../lib/useTheme';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { colors: t } = useTheme();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(main)/dashboard'), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.content}>
        <LogoFull size="md" />
        <View style={[styles.iconWrap, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
          <Text style={[styles.checkmark, { color: t.accent }]}>✓</Text>
        </View>
        <Text style={[styles.title, { color: t.text }]}>Payment successful</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>
          Your subscription is active. Thank you for choosing InTrackLog.
        </Text>
        <Text style={[styles.note, { color: t.textGrey }]}>
          You can now access all your plan features. A receipt has been emailed to you.
        </Text>
        <View style={{ marginTop: 32, width: '100%', maxWidth: 280 }}>
          <Button title="Go to dashboard" onPress={() => router.replace('/(main)/dashboard')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  checkmark: { fontSize: 44, fontFamily: 'DMSans-Bold', lineHeight: 56 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, textAlign: 'center', letterSpacing: -0.5, marginTop: 8 },
  subtitle: { fontFamily: 'DMSans-Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  note: { fontFamily: 'DMSans-Regular', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8, fontStyle: 'italic' },
});
