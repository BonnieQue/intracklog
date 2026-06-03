import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/useTheme';

export default function PrivacyPolicyScreen() {
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

  const Bold = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ fontFamily: 'DMSans-Bold', color: t.text }}>{children}</Text>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: t.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: t.textGrey }]}>Last updated: 16 April 2026</Text>

        <Section title="1. Introduction">
          <P>
            InTrackLog (Pty) Ltd ("InTrackLog", "we", "us", "our") serves as the data controller for personal
            information collected through the InTrackLog platform, including all websites and mobile applications
            (collectively, the "InTrackLog Platform").
          </P>
          <P>
            This Privacy Policy describes the collection, use, disclosure, and sharing of your personal information
            when you use the InTrackLog Platform. "Personal information" means information relating to an identified
            or identifiable natural person.
          </P>
          <P>
            We collect personal information directly from you, from third parties, and automatically through
            your use of the InTrackLog Platform. GPS positioning data collected during trip tracking is considered
            personal data.
          </P>
          <P>
            By using InTrackLog, you agree to the collection and use of information in accordance with this policy.
            If you do not agree with the terms of this policy, please do not access or use the InTrackLog Platform.
          </P>
        </Section>

        <Section title="2. The Information We Collect">
          <Text style={[styles.subHeading, { color: t.text }]}>Account Information</Text>
          <P>
            When you create an InTrackLog account, we collect your name, email address, password, employee number
            (if provided), and vehicle registration details including licence plate numbers and country of registration.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Your Content</Text>
          <P>
            This includes trip data such as start and stop locations, GPS coordinates collected through manual
            or automatic tracking features, odometer readings, mileage records, expense entries, receipt images,
            and any notes or descriptions you add.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Communications</Text>
          <P>
            We maintain records of communications you have with us, whether by email, in-app messaging,
            or other means, including customer support interactions.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Surveys</Text>
          <P>
            If you participate in surveys, we collect your responses about product usage and preferences.
            Survey data may be used internally for product improvement and, in anonymised form, for statistics.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Automatically Collected Information</Text>
          <P>
            We automatically collect certain information when you use the InTrackLog Platform, including device type,
            operating system, app version, unique device identifiers, IP address, timestamps, timezone information,
            and usage patterns such as features accessed and pages viewed.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Team and Workplace Data</Text>
          <P>
            If you use the Teams feature, we collect team names, workplace locations and addresses,
            team member details, mileage reimbursement rates, and trip data associated with shared workplaces.
          </P>
        </Section>

        <Section title="3. Purposes and Legal Basis for Using Information">
          <P>
            <Bold>We do not sell your personal data — such as your name, contact information, or location data — to
            third parties to use for their own marketing purposes.</Bold>
          </P>
          <P>We use the information we collect for the following purposes:</P>

          <Bullet>
            <Bold>Provide Services: </Bold>Deliver the InTrackLog Platform services, track and log your vehicle trips
            and mileage, generate expense and trip reports, calculate mileage reimbursements, process subscription
            payments, communicate about your usage, respond to inquiries, and provide customer support
          </Bullet>
          <Bullet>
            <Bold>Personalisation: </Bold>Customise your experience, suggest relevant features, offer location-based
            functionality, and provide personalised help and recommendations
          </Bullet>
          <Bullet>
            <Bold>Analytics: </Bold>Gather metrics to understand how users access and use the InTrackLog Platform,
            evaluate and improve our services, and develop new products and features
          </Bullet>
          <Bullet>
            <Bold>Comply with Law: </Bold>Meet legal obligations including SARS reporting requirements, tax record
            keeping, and other regulatory compliance under South African law
          </Bullet>
          <Bullet>
            <Bold>Marketing: </Bold>Send service updates, feature announcements, and promotional communications
            (with your consent where required)
          </Bullet>
          <Bullet>
            <Bold>Prevent Misuse: </Bold>Investigate illegal activities, suspected fraud, threats to safety,
            and violations of our Terms of Service
          </Bullet>
        </Section>

        <Section title="4. How We Share Your Information">
          <P>We may share your information in the following circumstances:</P>

          <Text style={[styles.subHeading, { color: t.text }]}>Service Providers</Text>
          <P>
            We share information with third-party service providers who perform services on our behalf,
            including payment processors, hosting providers, customer support services, and analytics providers.
            These providers are contractually obligated to protect your data.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Team Features</Text>
          <P>
            If you join or create a team, your trip data to the shared workplace may be visible to team administrators.
            Mileage reports submitted to employers or team managers remain accessible to those recipients.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Business Transfers</Text>
          <P>
            In the event of a merger, acquisition, sale of assets, restructuring, or bankruptcy, your information
            may be disclosed or transferred as part of that transaction.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Legally Required</Text>
          <P>
            We may disclose your information if required to do so by law, regulation, or legal process,
            including requests from SARS or other government authorities.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Protection of Rights</Text>
          <P>
            We may disclose information to respond to legal claims, comply with legal processes, enforce our
            agreements, prevent fraud, assess risk, and protect the rights, property or safety of InTrackLog,
            its users, or others.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Anonymised and Aggregated Data</Text>
          <P>
            We may share de-identified, aggregated information for research, marketing, and analytics purposes,
            provided such information does not identify a particular individual.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Sub-processors</Text>
          <P>We use the following third-party services to operate the InTrackLog Platform:</P>
          <Bullet>Supabase — Database hosting, authentication, and file storage</Bullet>
          <Bullet>Expo / React Native — Application framework and distribution</Bullet>
          <Bullet>AsyncStorage — Local device storage for preferences</Bullet>
          <Bullet>Device GPS Services — Location tracking (with your permission)</Bullet>
        </Section>

        <Section title="5. Location Data">
          <P>
            InTrackLog collects GPS location data only when you actively start a trip using the "Start a trip" feature.
            We do not perform background location tracking without your knowledge or consent.
          </P>
          <P>
            Location data is used to record trip routes, calculate distances, and identify start and end locations
            through reverse geocoding. You can deny location permissions at any time through your device settings,
            though this will prevent the GPS trip tracking feature from functioning.
          </P>
          <P>
            We do not sell location data to third parties.
          </P>
        </Section>

        <Section title="6. Cookies, Local Storage, and Tracking">
          <P>
            The InTrackLog mobile app uses local device storage (AsyncStorage) to save your preferences,
            including theme settings, saved locations, team configurations, and subscription tier.
            This data is stored locally on your device.
          </P>
          <P>
            On the web platform, we may use cookies — small files with unique identifiers — to remember
            logged-in users, understand how users navigate through and use the platform, and improve performance.
          </P>
          <P>
            We may use internal analytics tools to gather metrics on how the InTrackLog Platform is accessed and used.
            Where third-party analytics tools are used, those companies may combine the information collected with
            other information they have independently collected.
          </P>
        </Section>

        <Section title="7. How We Protect Your Information">
          <P>
            We have implemented safeguards to protect the information we collect, including:
          </P>
          <Bullet>Encryption of data in transit using TLS/SSL</Bullet>
          <Bullet>Encryption of data at rest</Bullet>
          <Bullet>Row-level security policies ensuring users can only access their own data</Bullet>
          <Bullet>Secure password hashing (passwords are never stored in plain text)</Bullet>
          <Bullet>Regular security audits and updates</Bullet>
          <P>
            While we strive to use commercially acceptable means to protect your data, no website or internet
            transmission is completely secure. We advise you to use strong passwords, keep them private,
            log out of your account when finished, and close your browser on shared or unsecured devices.
          </P>
        </Section>

        <Section title="8. Access and Amend Your Information">
          <P>
            You may update or correct your account information at any time by logging into your account and
            navigating to Edit Account {'>'} Account Details. You can update your name, email address,
            employee number, and password directly within the app.
          </P>
        </Section>

        <Section title="9. Your Choices">
          <Text style={[styles.subHeading, { color: t.text }]}>Declining Information Submission</Text>
          <P>
            You may decline to submit certain information, though this may prevent you from using certain
            features of the InTrackLog Platform.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Communications</Text>
          <P>
            You may unsubscribe from marketing and promotional communications at any time. Opting out of
            promotional emails does not prevent transactional emails about your account or requested services.
          </P>

          <Text style={[styles.subHeading, { color: t.text }]}>Account Deletion</Text>
          <P>
            You may request deletion of your account and all associated data by contacting us at
            privacy@intracklog.com. Please note that data actively shared with other users or teams
            (such as mileage reports submitted to employers) may remain accessible to those recipients
            even after your account is deleted.
          </P>
        </Section>

        <Section title="10. Your Rights">
          <P>
            Under the Protection of Personal Information Act (POPIA) and, where applicable,
            the General Data Protection Regulation (GDPR), you have the right to:
          </P>
          <Bullet>Access your personal information held by us</Bullet>
          <Bullet>Request correction or rectification of inaccurate or incomplete data</Bullet>
          <Bullet>Request deletion of your personal data</Bullet>
          <Bullet>Object to or restrict the processing of your personal data</Bullet>
          <Bullet>Withdraw consent for data processing</Bullet>
          <Bullet>Request data portability in a commonly used format (where technically feasible)</Bullet>
          <Bullet>Lodge a complaint with a supervisory data protection authority</Bullet>
          <P>
            To exercise any of these rights, contact our privacy coordinator at privacy@intracklog.com.
            We will respond in accordance with applicable law. Please note that certain services will not
            be available if you withdraw your consent or otherwise delete or object to our processing.
          </P>
        </Section>

        <Section title="11. Retention of Your Data">
          <P>
            We retain your personal information for as long as you have an account with us. If you wish
            to have your data deleted, you must request account deletion by contacting privacy@intracklog.com.
          </P>
          <P>
            Following deletion, we may retain data as necessary to comply with our legal obligations
            (including SARS record-keeping requirements of 5 years), resolve disputes, maintain appropriate
            business records, and enforce our agreements.
          </P>
          <P>
            Data actively shared with other users or teams — such as mileage reports submitted to employers
            or team administrators — will remain accessible to those recipients even after your account is deleted.
          </P>
        </Section>

        <Section title="12. Transferring Your Data">
          <P>
            InTrackLog is headquartered in South Africa. Our service providers may be located in other countries,
            meaning your personal data may be subject to privacy laws that are different from those in your
            country of residence.
          </P>
          <P>
            Where data is transferred outside of South Africa or the European Economic Area, we ensure
            that such transfers comply with applicable privacy laws and that appropriate contractual,
            technical, and organisational measures are in place to protect your data.
          </P>
        </Section>

        <Section title="13. Children's Privacy">
          <P>
            The InTrackLog Platform is not intended for use by individuals under the age of 18. We do not
            knowingly collect personal information from children. If we become aware that we have collected
            data from a child, we will take steps to delete it promptly.
          </P>
        </Section>

        <Section title="14. Links to Other Websites">
          <P>
            The InTrackLog Platform may contain links to third-party websites or services. We are not
            responsible for the practices of such third parties, whose information practices are subject
            to their own policies and procedures, not to this Privacy Policy. We encourage you to read
            the privacy policies of any third-party services you access.
          </P>
        </Section>

        <Section title="15. Changes to This Privacy Policy">
          <P>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            and the "Last updated" date will be revised. For material changes, we will provide reasonable
            notice through prominent notice in the InTrackLog Platform or by email, and where legally
            required, we will obtain your consent or provide you with the opportunity to opt out.
          </P>
          <P>
            Your continued use of the InTrackLog Platform after changes constitutes acceptance of the
            updated policy.
          </P>
        </Section>

        <Section title="16. Contact Us">
          <P>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices:</P>
          <P>
            <Bold>Email: </Bold>privacy@intracklog.com{'\n'}
            <Bold>Website: </Bold>www.intracklog.com
          </P>
          <P>
            <Bold>InTrackLog (Pty) Ltd</Bold>{'\n'}
            Attn: Privacy{'\n'}
            South Africa
          </P>
          <P>
            You also have the right to lodge a complaint with the Information Regulator:{'\n\n'}
            Information Regulator (South Africa){'\n'}
            complaints.IR@justice.gov.za{'\n'}
            012 406 4818
          </P>
        </Section>

        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <Text style={[styles.footerText, { color: t.textGrey }]}>© 2026 InTrackLog (Pty) Ltd. All rights reserved.</Text>
          <Text style={[styles.footerText, { color: t.textGrey }]}>This policy is governed by the laws of the Republic of South Africa.</Text>
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
  subHeading: { fontFamily: 'DMSans-Bold', fontSize: 14, marginTop: 14, marginBottom: 6 },
  paragraph: { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: 16 },
  bulletDot: { fontFamily: 'DMSans-Bold', fontSize: 14, lineHeight: 22 },
  bulletText: { flex: 1, fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22 },
  footer: { borderTopWidth: 1, paddingTop: 20, marginTop: 12, alignItems: 'center', gap: 4 },
  footerText: { fontFamily: 'DMSans-Regular', fontSize: 11, textAlign: 'center' },
});
