import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoFull, LogoIcon } from '../components/Logo';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useTheme } from '../lib/useTheme';
import { useAuthStore } from '../stores/authStore';

const FEATURES = [
  { icon: '◎', title: 'Trip logging', desc: 'Record every journey with odometer readings and automatic distance calculations.' },
  { icon: '⚶', title: 'Expense tracking', desc: 'Log fuel, services, tyres, tolls, and more — all in South African Rand.' },
  { icon: '✦', title: 'Receipt capture', desc: 'Snap photos of receipts or attach files to keep everything in one place.' },
];

export default function LandingScreen() {
  const router = useRouter();
  const { fetchMe, user } = useAuthStore();
  const { colors: t } = useTheme();

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => { if (user) router.replace('/(main)/dashboard'); }, [user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.dot, { backgroundColor: t.accent }]} />
            <Text style={[styles.badgeText, { color: t.textMuted }]}>Vehicle tracking made simple</Text>
          </View>
          <LogoFull size="lg" />
          <Text style={[styles.heroTitle, { color: t.text }]}>Track every{'\n'}<Text style={[styles.heroAccent, { color: t.accent }]}>journey</Text> that{'\n'}matters</Text>
          <Text style={[styles.heroSub, { color: t.textMuted }]}>Log mileage, manage expenses, and keep your fleet organised — all from your phone.</Text>
          <View style={styles.ctas}>
            <Button title="Get started" onPress={() => router.push('/(auth)/register')} />
            <Button title="Sign in" variant="secondary" onPress={() => router.push('/(auth)/login')} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.accent }]}>FEATURES</Text>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Everything you need to{'\n'}stay <Text style={{ fontStyle: 'italic', color: t.accent }}>on track</Text></Text>
          <View style={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <Card key={i} style={styles.featCard}>
                <View style={[styles.featIcon, { backgroundColor: i === 1 ? t.secondaryBg : t.accentBg }]}>
                  <Text style={{ fontSize: 20, color: i === 1 ? t.secondary : t.accent }}>{f.icon}</Text>
                </View>
                <Text style={[styles.featTitle, { color: t.text }]}>{f.title}</Text>
                <Text style={[styles.featDesc, { color: t.textMuted }]}>{f.desc}</Text>
              </Card>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <LogoIcon size={28} />
          <Text style={[styles.footerText, { color: t.textMuted }]}>InTrackLog — Drive forward. Track smart.</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/privacy-policy')}>
            <Text style={[styles.copyright, { color: t.accent }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.copyright, { color: t.textGrey }]}>© 2026 InTrackLog. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { paddingBottom: 60 },
  hero: { paddingHorizontal: '15%', paddingTop: 48, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, marginBottom: 32 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  heroTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 48, textAlign: 'center', lineHeight: 52, letterSpacing: -1, marginTop: 32, marginBottom: 20 },
  heroAccent: { fontFamily: 'InstrumentSerif-Italic' },
  heroSub: { fontFamily: 'DMSans-Regular', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 340, marginBottom: 36 },
  ctas: { flexDirection: 'row', gap: 14 },
  section: { paddingHorizontal: '15%', paddingTop: 60 },
  sectionLabel: { fontSize: 12, letterSpacing: 3, fontFamily: 'DMSans-Bold', marginBottom: 12 },
  sectionTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, lineHeight: 36, letterSpacing: -0.5, marginBottom: 32 },
  featGrid: { gap: 14 }, featCard: { padding: 24 },
  featIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', marginBottom: 6, letterSpacing: -0.3 },
  featDesc: { fontSize: 14, fontFamily: 'DMSans-Regular', lineHeight: 21 },
  footer: { paddingHorizontal: '15%', paddingTop: 60, paddingBottom: 20, alignItems: 'center', gap: 10 },
  footerText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  copyright: { fontFamily: 'DMSans-Regular', fontSize: 11 },
});
