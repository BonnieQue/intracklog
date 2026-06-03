import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/useTheme';

export default function TermsScreen() {
  const router = useRouter();
  const { colors: t } = useTheme();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {children}
    </View>
  );
  const P = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.paragraph, { color: t.textMuted }]}>{children}</Text>
  );
  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: t.accent }]}>•</Text>
      <Text style={[styles.bulletText, { color: t.textMuted }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: t.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]}>Terms of Service</Text>
        <Text style={[styles.lastUpdated, { color: t.textGrey }]}>Last updated: 28 April 2026</Text>

        <Section title="1. Acceptance of Terms">
          <P>By accessing or using the InTrackLog mobile application or web platform ("Service"), operated by InTrackLog (Pty) Ltd ("we", "us", "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>InTrackLog is a vehicle mileage and expense tracking platform designed for individuals, fleet operators, and teams in South Africa. The Service allows users to log trips, track vehicle expenses, generate reports, and manage team-based mileage reimbursement.</P>
        </Section>

        <Section title="3. User Accounts">
          <P>You must register an account to use most features of the Service. You agree to:</P>
          <Bullet>Provide accurate and complete information during registration</Bullet>
          <Bullet>Maintain the confidentiality of your password</Bullet>
          <Bullet>Be responsible for all activities under your account</Bullet>
          <Bullet>Notify us immediately of any unauthorised access</Bullet>
          <Bullet>Be at least 18 years of age</Bullet>
        </Section>

        <Section title="4. Subscription Plans">
          <P>InTrackLog offers a Free tier and paid subscription tiers (Starter, Pro, Business). Paid subscriptions are billed monthly via PayFast. By subscribing, you authorise recurring monthly charges until you cancel.</P>
          <P>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods unless required by law.</P>
        </Section>

        <Section title="5. Acceptable Use">
          <P>You agree not to:</P>
          <Bullet>Use the Service for any unlawful purpose</Bullet>
          <Bullet>Submit false or misleading mileage records</Bullet>
          <Bullet>Reverse engineer, decompile, or attempt to extract source code</Bullet>
          <Bullet>Interfere with or disrupt the Service or its servers</Bullet>
          <Bullet>Use automated tools or bots to access the Service</Bullet>
          <Bullet>Resell, sublicense, or redistribute the Service without authorisation</Bullet>
          <Bullet>Submit content that is defamatory, infringing, or harmful</Bullet>
        </Section>

        <Section title="6. User Content">
          <P>You retain ownership of all data you submit to the Service ("Your Content"), including trip logs, vehicle information, and expense records. You grant us a limited licence to host, store, and process Your Content solely to provide the Service.</P>
          <P>You are responsible for the accuracy of Your Content. We may remove content that violates these Terms or applicable law.</P>
        </Section>

        <Section title="7. Mileage Reports and Tax Compliance">
          <P>InTrackLog generates mileage reports based on data you provide. While we strive for accuracy, the Service is a tool to assist record-keeping — not a substitute for professional tax advice. You are solely responsible for:</P>
          <Bullet>The accuracy of your mileage and expense records</Bullet>
          <Bullet>Submitting compliant tax returns and reimbursement claims</Bullet>
          <Bullet>Retaining supporting documentation as required by SARS</Bullet>
        </Section>

        <Section title="8. Teams and Workplace Sharing">
          <P>If you create or join a team, you acknowledge that:</P>
          <Bullet>Trip data to shared workplaces may be visible to team administrators</Bullet>
          <Bullet>Mileage reports submitted to employers remain accessible to those recipients</Bullet>
          <Bullet>You consent to such sharing as part of your employment or contractual relationship</Bullet>
        </Section>

        <Section title="9. Payments and Billing">
          <P>Paid subscriptions are processed by PayFast (DPO Group), a South African payment processor. By subscribing, you authorise PayFast to debit your nominated card or account on a recurring basis.</P>
          <P>Prices are displayed in South African Rand (ZAR) and include VAT where applicable. We reserve the right to change pricing with 30 days' notice.</P>
          <P>Failed payments may result in suspension or downgrade of your account.</P>
        </Section>

        <Section title="10. Intellectual Property">
          <P>The Service, including all software, designs, text, graphics, and trademarks, is owned by InTrackLog (Pty) Ltd and protected by South African and international copyright, trademark, and other intellectual property laws.</P>
          <P>You may not copy, modify, or create derivative works without our written permission.</P>
        </Section>

        <Section title="11. Privacy">
          <P>Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to the practices described in the Privacy Policy.</P>
        </Section>

        <Section title="12. Service Availability">
          <P>We strive to maintain high availability but do not guarantee uninterrupted service. The Service is provided "as is" and "as available" without warranties of any kind, express or implied.</P>
          <P>Scheduled maintenance and unforeseen outages may temporarily affect availability. We are not liable for any loss or inconvenience caused by such interruptions.</P>
        </Section>

        <Section title="13. Limitation of Liability">
          <P>To the maximum extent permitted by South African law, InTrackLog (Pty) Ltd shall not be liable for any indirect, incidental, consequential, or punitive damages, including but not limited to:</P>
          <Bullet>Loss of profits, revenue, or business opportunities</Bullet>
          <Bullet>Loss of data or content</Bullet>
          <Bullet>Tax penalties resulting from inaccurate records</Bullet>
          <Bullet>Damage to vehicles or property</Bullet>
          <P>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</P>
        </Section>

        <Section title="14. Indemnification">
          <P>You agree to indemnify and hold harmless InTrackLog (Pty) Ltd, its directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third party's rights.</P>
        </Section>

        <Section title="15. Termination">
          <P>You may terminate your account at any time by contacting privacy@intracklog.com or through in-app account deletion.</P>
          <P>We may suspend or terminate your account if you violate these Terms, fail to pay subscription fees, or engage in fraudulent activity. Upon termination, your right to use the Service ceases immediately, though certain provisions (such as liability and intellectual property clauses) survive.</P>
        </Section>

        <Section title="16. Changes to These Terms">
          <P>We may update these Terms from time to time. Material changes will be communicated through the Service or by email. Your continued use after changes constitutes acceptance.</P>
        </Section>

        <Section title="17. Governing Law and Disputes">
          <P>These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved by the South African courts, unless otherwise required by mandatory consumer protection law.</P>
          <P>Before pursuing legal action, you agree to first attempt informal resolution by contacting support@intracklog.com.</P>
        </Section>

        <Section title="18. Severability">
          <P>If any provision of these Terms is found unenforceable, the remaining provisions continue in full force and effect.</P>
        </Section>

        <Section title="19. Contact Us">
          <P>For questions about these Terms:</P>
          <Bullet>Email: support@intracklog.com</Bullet>
          <Bullet>Website: www.intracklog.com</Bullet>
          <P>InTrackLog (Pty) Ltd{'\n'}South Africa</P>
        </Section>

        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <Text style={[styles.footerText, { color: t.textGrey }]}>© 2026 InTrackLog (Pty) Ltd. All rights reserved.</Text>
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
  lastUpdated: { fontFamily: 'DMSans-Regular', fontSize: 12, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'DMSans-Bold', fontSize: 17, marginBottom: 10 },
  paragraph: { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: 16 },
  bulletDot: { fontFamily: 'DMSans-Bold', fontSize: 14, lineHeight: 22 },
  bulletText: { flex: 1, fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22 },
  footer: { borderTopWidth: 1, paddingTop: 20, marginTop: 12, alignItems: 'center', gap: 4 },
  footerText: { fontFamily: 'DMSans-Regular', fontSize: 11, textAlign: 'center' },
});
