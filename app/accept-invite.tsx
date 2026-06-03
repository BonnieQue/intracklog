import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { LogoIcon } from '../components/Logo';
import { useTheme } from '../lib/useTheme';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { apiGetInviteByToken, apiAcceptInvite, InviteByTokenResponse } from '../lib/api';

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, fetchMe } = useAuthStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<InviteByTokenResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
    (async () => {
      try {
        if (!token) { setErr('No invite token in the link.'); return; }
        const inv = await apiGetInviteByToken(token);
        if (!inv) { setErr('Invite not found or has been removed.'); return; }
        if (inv.status !== 'pending') { setErr(`This invite was already ${inv.status}.`); }
        setInvite(inv);
      } catch (e: any) { setErr(e.message || 'Could not load invite.'); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const onAccept = async () => {
    if (!token || busy) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setBusy(true);
    try {
      const res = await apiAcceptInvite(token);
      if (!res.ok) {
        const msg = res.error === 'email_mismatch'
          ? `This invite was sent to ${invite?.email}. Sign in with that email to accept.`
          : res.error === 'not_authenticated'
            ? 'Please sign in first.'
            : `Could not accept the invite (${res.error}).`;
        toast.show(msg);
        return;
      }
      toast.show(`You've joined ${invite?.team_name || 'the team'}`);
      router.replace('/(main)/dashboard');
    } catch (e: any) {
      toast.show(e.message || 'Could not accept the invite.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.content}>
        <View style={styles.logo}><LogoIcon size={56} /></View>
        {loading ? (
          <ActivityIndicator color={t.accent} />
        ) : err ? (
          <>
            <Text style={[styles.title, { color: t.text }]}>Something's not right</Text>
            <Text style={[styles.body, { color: t.textMuted }]}>{err}</Text>
            <Button title="Go home" variant="secondary" onPress={() => router.replace('/')} fullWidth />
          </>
        ) : invite ? (
          <>
            <Text style={[styles.title, { color: t.text }]}>Join <Text style={{ color: t.accent, fontStyle: 'italic' }}>{invite.team_name}</Text></Text>
            <Text style={[styles.workplace, { color: t.textMuted }]}>{invite.team_workplace}</Text>
            <Text style={[styles.body, { color: t.textMuted }]}>
              You've been invited to log mileage and submit reimbursement claims to this team.
              {!user && '\n\nSign in with ' + invite.email + ' to accept.'}
            </Text>
            <Button
              title={user ? (busy ? 'Accepting…' : 'Accept invite') : 'Sign in to accept'}
              onPress={onAccept}
              loading={busy}
              fullWidth
            />
            <View style={{ height: 10 }} />
            <Button title="Not now" variant="secondary" onPress={() => router.replace('/')} fullWidth />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logo: { marginBottom: 24 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 30, textAlign: 'center', letterSpacing: -0.5, marginBottom: 4 },
  workplace: { fontFamily: 'DMSans-Medium', fontSize: 14, marginBottom: 18, textAlign: 'center' },
  body: { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 28 },
});
