import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/useTheme';

const FAQS = [
  {
    q: 'How do I track a trip?',
    a: 'Tap the "Start a trip" button on the dashboard, choose your vehicle if you have multiple, and the app will track your route via GPS until you tap "Stop & save trip". Trip tracking only works on the mobile app.',
  },
  {
    q: 'How do I add a new vehicle?',
    a: 'Tap the "Vehicles" button on the dashboard, then tap "Add vehicle". Fill in the licence plate, description, and current odometer reading.',
  },
  {
    q: 'What\'s the difference between subscription tiers?',
    a: 'Free supports 3 vehicles. Starter supports 5 vehicles with GPS tracking. Pro supports 10 vehicles plus Teams. Business is unlimited. Tap your plan in Edit Account to upgrade.',
  },
  {
    q: 'How do I share trips with my employer?',
    a: 'Use the Teams feature (Pro and Business plans). Create a team with your workplace, invite your employer or manager, and your trips to that workplace will be automatically reported.',
  },
  {
    q: 'Can I export my mileage report for SARS?',
    a: 'Yes. Go to Account → Settings → Generate Report. The summary includes all trips, distances, and expenses needed for SARS travel allowance claims.',
  },
  {
    q: 'What is the standard mileage rate?',
    a: 'The current SARS reimbursement rate is R 4.64 per km. You can set this in Settings → Mileage Rate, or use a custom rate per team.',
  },
  {
    q: 'How do I update my odometer reading?',
    a: 'Go to Account → Settings → Odometer to update each vehicle\'s current reading. The dashboard automatically tracks readings from your trip entries.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Switch to the Free plan in Edit Account → My Subscription. PayFast subscriptions can also be cancelled directly through PayFast or by contacting us.',
  },
  {
    q: 'Why isn\'t GPS tracking working?',
    a: 'Make sure you granted location permission to InTrackLog. On Android: Settings → Apps → InTrackLog → Permissions → Location → Allow. On iOS: Settings → InTrackLog → Location → Always or While Using.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Data is encrypted in transit and at rest. We use Supabase with row-level security so only you can access your data. Read our Privacy Policy for full details.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email privacy@intracklog.com to request account deletion. All personal data will be removed within 30 days, except where retention is required by law (e.g. SARS records).',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { colors: t } = useTheme();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: t.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]}>Help & Support</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>Find answers to common questions or contact our support team.</Text>

        {/* Contact card */}
        <View style={[styles.contactCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.contactTitle, { color: t.text }]}>Need to reach us?</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@intracklog.com')} style={[styles.contactRow, { borderTopColor: t.border }]}>
            <Text style={styles.contactIcon}>✉</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactLabel, { color: t.text }]}>Email support</Text>
              <Text style={[styles.contactValue, { color: t.accent }]}>support@intracklog.com</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.intracklog.com/help')} style={[styles.contactRow, { borderTopColor: t.border }]}>
            <Text style={styles.contactIcon}>🌐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactLabel, { color: t.text }]}>Help centre</Text>
              <Text style={[styles.contactValue, { color: t.accent }]}>www.intracklog.com/help</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={[styles.faqTitle, { color: t.text }]}>Frequently asked questions</Text>
        {FAQS.map((faq, i) => (
          <View key={i} style={[styles.faqCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Pressable onPress={() => setOpenIdx(openIdx === i ? null : i)} style={styles.faqHeader}>
              <Text style={[styles.faqQ, { color: t.text }]}>{faq.q}</Text>
              <Text style={[styles.faqArrow, { color: t.textMuted }]}>{openIdx === i ? '−' : '+'}</Text>
            </Pressable>
            {openIdx === i && (
              <View style={[styles.faqAnswer, { borderTopColor: t.border }]}>
                <Text style={[styles.faqA, { color: t.textMuted }]}>{faq.a}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Legal links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/(main)/privacy-policy')}>
            <Text style={[styles.legalLink, { color: t.accent }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.legalSep, { color: t.textGrey }]}>·</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/terms')}>
            <Text style={[styles.legalLink, { color: t.accent }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  backText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  scroll: { paddingHorizontal: '8%', paddingVertical: 24, paddingBottom: 60 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 36, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontFamily: 'DMSans-Regular', fontSize: 14, marginBottom: 24 },
  contactCard: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 28 },
  contactTitle: { fontFamily: 'DMSans-Bold', fontSize: 15, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, marginTop: 8 },
  contactIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  contactLabel: { fontFamily: 'DMSans-Medium', fontSize: 12 },
  contactValue: { fontFamily: 'DMSans-Bold', fontSize: 13, marginTop: 2 },
  faqTitle: { fontFamily: 'DMSans-Bold', fontSize: 18, marginBottom: 14 },
  faqCard: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  faqQ: { flex: 1, fontFamily: 'DMSans-Medium', fontSize: 14, lineHeight: 20, marginRight: 12 },
  faqArrow: { fontFamily: 'DMSans-Bold', fontSize: 22 },
  faqAnswer: { padding: 16, borderTopWidth: 1 },
  faqA: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 20 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 24, alignItems: 'center' },
  legalLink: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  legalSep: { fontSize: 13 },
});
