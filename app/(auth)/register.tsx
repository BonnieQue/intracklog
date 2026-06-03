import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoIcon } from '../../components/Logo';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useTheme } from '../../lib/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  // Password requirement checks (6 is the minimum — longer is encouraged)
  const pwLength = password.length >= 6;
  const pwHasLetter = /[a-zA-Z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const pwAllValid = pwLength && pwHasLetter && pwHasNumber;

  // Strength: weak / good / strong based on length and complexity
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasSpecial = /[^a-zA-Z0-9]/.test(password);
  let pwStrength: 'weak' | 'good' | 'strong' | '' = '';
  let pwStrengthColor = t.textGrey;
  if (pwAllValid) {
    if (password.length >= 12 || (password.length >= 10 && (pwHasUpper || pwHasSpecial))) {
      pwStrength = 'strong'; pwStrengthColor = t.accent;
    } else if (password.length >= 8 || pwHasUpper || pwHasSpecial) {
      pwStrength = 'good'; pwStrengthColor = t.info;
    } else {
      pwStrength = 'weak'; pwStrengthColor = t.secondary;
    }
  }

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const next = async () => {
    setEmailError(''); setPasswordError('');
    if (!name.trim()) { toast.show('Please enter your full name.'); return; }
    if (!email.trim()) { setEmailError('Please enter your email address.'); return; }
    if (!validateEmail(email.trim())) { setEmailError('Please enter a valid email address.'); return; }
    if (!password) { setPasswordError('Please choose a password.'); return; }
    if (!pwAllValid) {
      const missing: string[] = [];
      if (!pwLength) missing.push('at least 6 characters');
      if (!pwHasLetter) missing.push('a letter');
      if (!pwHasNumber) missing.push('a number');
      const msg = `Your password needs ${missing.join(', ')}.`;
      setPasswordError('Password must meet all requirements below.');
      // Native popup so testers can't miss it
      if (Platform.OS === 'web') { window.alert(msg); }
      else { Alert.alert('Password requirements', msg, [{ text: 'OK' }]); }
      return;
    }
    try {
      const lowerEmail = email.trim().toLowerCase();
      const result = await register(name.trim(), lowerEmail, password);
      if (result.requiresVerification) {
        // Email confirmation is on — account created but no session. Show verification panel.
        setVerificationEmail(lowerEmail);
        setVerificationSent(true);
        return;
      }
      // Confirmation off path: user is signed in, continue to vehicle setup.
      router.push('/(auth)/register-vehicle');
    } catch (e: any) {
      const msg = (e.message || 'Registration failed').toLowerCase();
      if (msg.includes('email') || msg.includes('already') || msg.includes('user')) {
        setEmailError(e.message);
      } else if (msg.includes('password')) {
        setPasswordError(e.message);
      } else {
        toast.show(e.message || 'Registration failed');
      }
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    setResentOk(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
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

  const Req = ({ ok, text }: { ok: boolean; text: string }) => (
    <View style={styles.reqRow}>
      <Text style={[styles.reqIcon, { color: ok ? t.accent : t.textGrey }]}>{ok ? '✓' : '○'}</Text>
      <Text style={[styles.reqText, { color: ok ? t.accent : t.textGrey }]}>{text}</Text>
    </View>
  );

  if (verificationSent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}><LogoIcon size={48} /></View>
          <View style={[styles.successIcon, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
            <Text style={[styles.successCheck, { color: t.accent }]}>✓</Text>
          </View>
          <Text style={[styles.title, { color: t.text }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>
            We sent a confirmation link to{'\n'}
            <Text style={{ color: t.accent, fontFamily: 'DMSans-Bold' }}>{verificationEmail}</Text>
          </Text>
          <Text style={[styles.verifyBody, { color: t.textMuted }]}>
            Tap the link in the email to activate your account, then come back here and sign in.
          </Text>
          <Text style={[styles.verifyTip, { color: t.textGrey }]}>
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
          <View style={{ height: 16 }} />
          <Button title="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
          <TouchableOpacity onPress={() => { setVerificationSent(false); setResentOk(false); }} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: t.textMuted }]}>Used the wrong email? <Text style={{ color: t.accent }}>Edit details</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={[styles.backText, { color: t.textMuted }]}>← Back</Text></TouchableOpacity>
          <View style={styles.stepper}>
            <View style={styles.stepCol}><View style={[styles.stepDot, { backgroundColor: t.accent, borderColor: t.accent }]}><Text style={styles.stepNumActive}>1</Text></View><Text style={[styles.stepLabel, { color: t.text }]}>Account</Text></View>
            <View style={[styles.stepLine, { backgroundColor: t.border }]} />
            <View style={styles.stepCol}><View style={[styles.stepDot, { borderColor: t.border }]}><Text style={[styles.stepNum, { color: t.textGrey }]}>2</Text></View><Text style={[styles.stepLabel, { color: t.textGrey }]}>Vehicle</Text></View>
          </View>
          <View style={styles.logoWrap}><LogoIcon size={40} /></View>
          <Text style={[styles.title, { color: t.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>Start tracking your vehicle mileage and expenses.</Text>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Jane Doe" />
          <Input label="Email" value={email} onChangeText={(v) => { setEmail(v); setEmailError(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={emailError} />
          <Input label="Password" value={password} onChangeText={(v) => { setPassword(v); setPasswordError(''); }} placeholder="Choose a password" secureTextEntry error={passwordError} />

          {/* Live password requirement checklist */}
          <View style={[styles.reqsBox, { borderColor: t.border, backgroundColor: t.surface }]}>
            <Text style={[styles.reqsTitle, { color: t.textMuted }]}>Password must include:</Text>
            <Req ok={pwLength} text="6 characters minimum (longer is stronger)" />
            <Req ok={pwHasLetter} text="A letter (a-z or A-Z)" />
            <Req ok={pwHasNumber} text="A number (0-9)" />

            {/* Strength indicator — shows once minimum is met */}
            {pwAllValid && (
              <View style={[styles.strengthRow, { borderTopColor: t.border }]}>
                <Text style={[styles.strengthLabel, { color: t.textMuted }]}>Strength:</Text>
                <View style={[styles.strengthTrack, { backgroundColor: t.bg }]}>
                  <View style={[styles.strengthFill, {
                    backgroundColor: pwStrengthColor,
                    width: pwStrength === 'strong' ? '100%' : pwStrength === 'good' ? '66%' : '33%',
                  }]} />
                </View>
                <Text style={[styles.strengthValue, { color: pwStrengthColor }]}>
                  {pwStrength === 'strong' ? 'Strong' : pwStrength === 'good' ? 'Good' : 'Weak — but accepted'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.policyNote, { color: t.textGrey }]}>
            By signing up, you agree to our{' '}
            <Text style={{ color: t.accent }} onPress={() => router.push('/(main)/privacy-policy')}>Privacy Policy</Text>
            {' '}and{' '}
            <Text style={{ color: t.accent }} onPress={() => router.push('/(main)/terms')}>Terms of Service</Text>.
          </Text>
          <Text style={[styles.verifyNote, { color: t.textMuted }]}>
            You'll receive a verification email after signup.
          </Text>
          <Button title="Continue" onPress={next} loading={loading} />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: t.textMuted }]}>Already have an account? <Text style={{ color: t.accent }}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { paddingHorizontal: '15%', paddingVertical: 12, paddingBottom: 40 },
  back: { marginBottom: 20 }, backText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepCol: { alignItems: 'center', gap: 6 },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  stepNumActive: { fontFamily: 'DMSans-Bold', fontSize: 13, color: '#ffffff' },
  stepLabel: { fontFamily: 'DMSans-Medium', fontSize: 11 },
  stepLine: { width: 40, height: 2, marginHorizontal: 8, marginBottom: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'DMSans-Regular', textAlign: 'center', marginBottom: 32 },
  policyNote: { fontFamily: 'DMSans-Regular', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 6 },
  verifyNote: { fontFamily: 'DMSans-Regular', fontSize: 11, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  reqsBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, marginTop: -8 },
  reqsTitle: { fontFamily: 'DMSans-Medium', fontSize: 11, marginBottom: 8, letterSpacing: 0.3 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  reqIcon: { fontFamily: 'DMSans-Bold', fontSize: 13, width: 14 },
  reqText: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  strengthLabel: { fontFamily: 'DMSans-Medium', fontSize: 11 },
  strengthTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthValue: { fontFamily: 'DMSans-Bold', fontSize: 11 },
  switchBtn: { alignItems: 'center', paddingVertical: 20 },
  switchText: { fontSize: 14, fontFamily: 'DMSans-Medium' },
  successIcon: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20, marginTop: 12 },
  successCheck: { fontFamily: 'DMSans-Bold', fontSize: 36, lineHeight: 44 },
  verifyBody: { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 12 },
  verifyTip: { fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 18, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
  resendBtn: { borderWidth: 1, borderRadius: 50, paddingVertical: 12, alignItems: 'center', marginBottom: 4 },
  resendBtnText: { fontFamily: 'DMSans-Bold', fontSize: 13, letterSpacing: 0.3 },
  resentPill: { borderWidth: 1, borderRadius: 50, paddingVertical: 12, alignItems: 'center', marginBottom: 4 },
  resentText: { fontFamily: 'DMSans-Bold', fontSize: 13, letterSpacing: 0.3 },
});
