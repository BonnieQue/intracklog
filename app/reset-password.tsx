import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoIcon } from '../components/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useTheme } from '../lib/useTheme';
import { useToastStore } from '../stores/toastStore';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Password requirement checks (same rules as registration)
  const pwLength = password.length >= 6;
  const pwHasLetter = /[a-zA-Z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const pwAllValid = pwLength && pwHasLetter && pwHasNumber;
  const pwMatch = password === confirm && password.length > 0;

  // On web, Supabase places the recovery token in the URL hash.
  // On mobile, the deep link handles it differently.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
      // Supabase auth-js automatically picks up the hash on initial load
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionReady(!!session);
      });
    } else {
      // For mobile or direct visits, check if we already have a session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionReady(!!session);
      });
    }
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!password) { setError('Please choose a new password.'); return; }
    if (!pwAllValid) {
      const missing: string[] = [];
      if (!pwLength) missing.push('at least 6 characters');
      if (!pwHasLetter) missing.push('a letter');
      if (!pwHasNumber) missing.push('a number');
      const msg = `Your password needs ${missing.join(', ')}.`;
      setError('Password must meet all requirements below.');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Password requirements', msg, [{ text: 'OK' }]);
      return;
    }
    if (!pwMatch) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Failed to update password. The reset link may have expired — please request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  const Req = ({ ok, text }: { ok: boolean; text: string }) => (
    <View style={styles.reqRow}>
      <Text style={[styles.reqIcon, { color: ok ? t.accent : t.textGrey }]}>{ok ? '✓' : '○'}</Text>
      <Text style={[styles.reqText, { color: ok ? t.accent : t.textGrey }]}>{text}</Text>
    </View>
  );

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.content}>
          <LogoIcon size={56} />
          <View style={[styles.successIcon, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
            <Text style={[styles.successCheck, { color: t.accent }]}>✓</Text>
          </View>
          <Text style={[styles.title, { color: t.text }]}>Password updated</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <View style={{ marginTop: 20, width: '100%', maxWidth: 280 }}>
            <Button title="Sign in" onPress={() => router.replace('/(auth)/login')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}><LogoIcon size={48} /></View>
          <Text style={[styles.title, { color: t.text }]}>Choose a new password</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>
            Enter a new password below to regain access to your account.
          </Text>

          {!sessionReady && Platform.OS === 'web' && (
            <View style={[styles.notice, { backgroundColor: t.secondaryBg, borderColor: t.secondaryBorder }]}>
              <Text style={[styles.noticeText, { color: t.secondary }]}>
                ⚠ Make sure you opened this page from the link we emailed you. If the link is missing or expired,
                request a new one from the login screen.
              </Text>
            </View>
          )}

          <Input
            label="New password"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(''); }}
            placeholder="Choose a new password"
            secureTextEntry
            error={error && !pwMatch ? '' : error}
          />

          <View style={[styles.reqsBox, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[styles.reqsTitle, { color: t.textMuted }]}>Password must include:</Text>
            <Req ok={pwLength} text="6 characters minimum (longer is stronger)" />
            <Req ok={pwHasLetter} text="A letter (a-z or A-Z)" />
            <Req ok={pwHasNumber} text="A number (0-9)" />
          </View>

          <Input
            label="Confirm new password"
            value={confirm}
            onChangeText={(v) => { setConfirm(v); setError(''); }}
            placeholder="Re-enter password"
            secureTextEntry
            error={confirm.length > 0 && !pwMatch ? 'Passwords do not match' : ''}
          />

          <Button title="Update password" onPress={handleSubmit} loading={submitting} />

          <Text style={[styles.footerText, { color: t.textGrey }]}
                onPress={() => router.replace('/(auth)/login')}>
            Cancel and return to <Text style={{ color: t.accent }}>sign in</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: '8%', paddingVertical: 24, paddingBottom: 60 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  logoWrap: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'DMSans-Regular', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  notice: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  noticeText: { fontFamily: 'DMSans-Medium', fontSize: 12, lineHeight: 18 },
  reqsBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, marginTop: -8 },
  reqsTitle: { fontFamily: 'DMSans-Medium', fontSize: 11, marginBottom: 8, letterSpacing: 0.3 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  reqIcon: { fontFamily: 'DMSans-Bold', fontSize: 13, width: 14 },
  reqText: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  footerText: { fontFamily: 'DMSans-Medium', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  successIcon: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  successCheck: { fontFamily: 'DMSans-Bold', fontSize: 44, lineHeight: 56 },
});
