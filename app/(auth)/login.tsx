import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoIcon } from '../../components/Logo';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useTheme } from '../../lib/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { useVehicleStore } from '../../stores/vehicleStore';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const clearLoginErrors = () => {
    setErrorEmail(''); setErrorPassword(''); setNeedsConfirmation(false); setResentOk(false);
  };

  const handleLogin = async () => {
    clearLoginErrors();
    if (!email.trim()) { setErrorEmail('Please enter your email.'); return; }
    if (!validateEmail(email.trim())) { setErrorEmail('Please enter a valid email address.'); return; }
    if (!password) { setErrorPassword('Please enter your password.'); return; }
    try {
      await login(email.trim().toLowerCase(), password);
      toast.show('Welcome back!');
      // First login after email verification: if user has no vehicles yet, take them through vehicle setup.
      try {
        await useVehicleStore.getState().fetchVehicles();
        if (useVehicleStore.getState().vehicles.length === 0) {
          router.replace('/(auth)/register-vehicle');
          return;
        }
      } catch {}
      router.replace('/(main)/dashboard');
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      // Email-confirmation related errors -> show confirmation panel with resend action
      if (msg.includes('not confirmed') || msg.includes('confirmation email') || msg.includes('email not verified')) {
        setNeedsConfirmation(true);
        return;
      }
      // Wrong credentials -> inline under password
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
        setErrorPassword('Wrong email or password. Please try again.');
        return;
      }
      // User not found
      if (msg.includes('user not found') || msg.includes('no user')) {
        setErrorEmail("We couldn't find an account with this email.");
        return;
      }
      // Rate limit
      if (msg.includes('rate limit') || msg.includes('too many')) {
        setErrorPassword('Too many attempts. Please wait a minute and try again.');
        return;
      }
      // Fallback
      setErrorPassword(e?.message || 'Sign in failed. Please try again.');
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    setResentOk(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: 'https://intracklog.com' },
      });
      if (error) throw error;
      setResentOk(true);
    } catch (e: any) {
      toast.show(e?.message || 'Could not resend right now. Please try again in a minute.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!resetEmail.trim()) { setResetError('Please enter your email address.'); return; }
    if (!validateEmail(resetEmail.trim())) { setResetError('Please enter a valid email address.'); return; }
    setResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: 'https://intracklog.com/reset-password',
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e: any) { setResetError(e.message || 'Failed to send reset email.'); }
    finally { setResetSending(false); }
  };

  const closeResetModal = () => {
    setShowReset(false); setResetEmail(''); setResetError(''); setResetSent(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={[styles.backText, { color: t.textMuted }]}>← Back</Text></TouchableOpacity>
          <View style={styles.logoWrap}><LogoIcon size={48} /></View>
          <Text style={[styles.title, { color: t.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>Sign in to continue tracking your journeys.</Text>
          <Input label="Email" value={email} onChangeText={(v) => { setEmail(v); if (errorEmail) setErrorEmail(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={errorEmail} />
          <Input label="Password" value={password} onChangeText={(v) => { setPassword(v); if (errorPassword) setErrorPassword(''); }} placeholder="••••••••" secureTextEntry error={errorPassword} />
          {needsConfirmation && (
            <View style={[styles.confirmBox, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
              <Text style={[styles.confirmTitle, { color: t.text }]}>Email not confirmed yet</Text>
              <Text style={[styles.confirmDesc, { color: t.textMuted }]}>
                We sent a confirmation link to <Text style={{ color: t.accent, fontFamily: 'DMSans-Bold' }}>{email.trim().toLowerCase()}</Text> when you signed up. Tap the link in that email to activate your account, then sign in.
              </Text>
              <Text style={[styles.confirmTip, { color: t.textGrey }]}>
                Can't find it? Check your spam folder. If it's not there, resend it below.
              </Text>
              {resentOk ? (
                <View style={[styles.resentPill, { borderColor: t.accent }]}>
                  <Text style={[styles.resentText, { color: t.accent }]}>✓ Confirmation email sent</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleResendConfirmation}
                  disabled={resending}
                  style={[styles.resendBtn, { borderColor: t.accent, opacity: resending ? 0.6 : 1 }]}
                >
                  <Text style={[styles.resendBtnText, { color: t.accent }]}>
                    {resending ? 'Sending…' : 'Resend confirmation email'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <Button title="Sign in" onPress={handleLogin} loading={loading} />
          <TouchableOpacity onPress={() => { setResetEmail(email); setShowReset(true); }} style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: t.accent }]}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: t.textMuted }]}>Don't have an account? <Text style={{ color: t.secondary }}>Register</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reset password modal */}
      <Modal visible={showReset} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={closeResetModal}>
          <Pressable style={[styles.resetModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => {}}>
            {!resetSent ? (
              <>
                <Text style={[styles.resetTitle, { color: t.text }]}>Reset password</Text>
                <Text style={[styles.resetDesc, { color: t.textMuted }]}>Enter your email and we'll send you a link to reset your password.</Text>
                <Input label="Email" value={resetEmail} onChangeText={(v) => { setResetEmail(v); setResetError(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={resetError} />
                <Button title="Send reset link" onPress={handleResetPassword} loading={resetSending} />
                <Pressable onPress={closeResetModal} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.successIcon, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
                  <Text style={[styles.successCheck, { color: t.accent }]}>✓</Text>
                </View>
                <Text style={[styles.resetTitle, { color: t.text }]}>Check your inbox</Text>
                <Text style={[styles.resetDesc, { color: t.textMuted }]}>
                  We sent a password reset link to{'\n'}
                  <Text style={{ color: t.accent, fontFamily: 'DMSans-Bold' }}>{resetEmail.trim().toLowerCase()}</Text>
                </Text>
                <Text style={[styles.resetTipText, { color: t.textGrey }]}>
                  Didn't get it? Check your spam folder, or wait a minute and try again.
                </Text>
                <Button title="Got it" onPress={closeResetModal} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { paddingHorizontal: '15%', paddingVertical: 12, paddingBottom: 40 },
  back: { marginBottom: 20 }, backText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  logoWrap: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'DMSans-Regular', textAlign: 'center', marginBottom: 32 },
  forgotBtn: { alignItems: 'center', paddingVertical: 12 },
  forgotText: { fontSize: 13, fontFamily: 'DMSans-Medium' },
  switchBtn: { alignItems: 'center', paddingVertical: 14 },
  switchText: { fontSize: 14, fontFamily: 'DMSans-Medium' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  resetModal: { width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1, padding: 28 },
  resetTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 26, textAlign: 'center', marginBottom: 8 },
  resetDesc: { fontFamily: 'DMSans-Regular', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  successIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  successCheck: { fontFamily: 'DMSans-Bold', fontSize: 32, lineHeight: 40 },
  resetTipText: { fontFamily: 'DMSans-Regular', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 16, fontStyle: 'italic' },
  confirmBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  confirmTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 20, marginBottom: 6, letterSpacing: -0.3 },
  confirmDesc: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  confirmTip: { fontFamily: 'DMSans-Regular', fontSize: 11, fontStyle: 'italic', lineHeight: 16, marginBottom: 12 },
  resendBtn: { borderWidth: 1, borderRadius: 50, paddingVertical: 10, alignItems: 'center' },
  resendBtnText: { fontFamily: 'DMSans-Bold', fontSize: 13, letterSpacing: 0.3 },
  resentPill: { borderWidth: 1, borderRadius: 50, paddingVertical: 10, alignItems: 'center' },
  resentText: { fontFamily: 'DMSans-Bold', fontSize: 13, letterSpacing: 0.3 },
});
