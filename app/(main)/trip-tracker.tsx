import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import TripMap from '../../components/TripMap';
import { vehicleColors } from '../../constants/colors';
import { useTheme } from '../../lib/useTheme';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useTripStore } from '../../stores/tripStore';
import { useToastStore } from '../../stores/toastStore';

export default function TripTrackerScreen() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const vehicle = useVehicleStore((s) => s.getVehicle(vehicleId || ''));
  const { isTracking, routeCoords, distanceKm, startTime, currentLocation, startTrip, stopTrip, reset } = useTripStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const [acquiring, setAcquiring] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showClassify, setShowClassify] = useState(false);
  const [saving, setSaving] = useState(false);

  const ci = vehicle?.color_index ?? 0;
  const vc = vehicleColors[ci % vehicleColors.length];

  // Auto-start GPS the moment this screen opens. The user already chose "Start trip" on the
  // previous screen — making them tap again was confusing testers, who waited thinking the
  // app was buffering.
  useEffect(() => {
    if (isTracking) return;
    let cancelled = false;
    (async () => {
      setAcquiring(true);
      const result = await startTrip();
      if (cancelled) return;
      setAcquiring(false);
      if (result.error) setPermissionError(result.error);
    })();
    return () => { cancelled = true; };
  }, []);

  const finishTrip = async (tripType?: 'business' | 'personal') => {
    if (!vehicleId || saving) return;
    setSaving(true);
    const result = await stopTrip(vehicleId, tripType);
    setSaving(false);
    setShowClassify(false);
    if (result.entryId) {
      toast.show(tripType ? `Trip saved as ${tripType}` : 'Trip saved!');
      router.replace('/(main)/dashboard');
    } else if (result.error) {
      toast.show(result.error);
      reset();
      router.back();
    } else {
      toast.show('Trip too short to save.');
      reset();
      router.back();
    }
  };

  const handleCancel = () => { reset(); router.back(); };

  const elapsed = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const timeStr = hours > 0
    ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${mins}:${String(secs).padStart(2, '0')}`;

  const [, setTick] = React.useState(0);
  useEffect(() => {
    if (!isTracking) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: vc.tint }]}>
            <Text style={[styles.badgeLetter, { color: vc.solid }]}>{vehicle?.badge || '?'}</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: t.text }]}>{vehicle?.name || 'Trip'}</Text>
            <Text style={[styles.subtitle, { color: t.textMuted }]}>
              {permissionError
                ? 'Location access needed'
                : acquiring
                ? 'Getting your location...'
                : isTracking
                ? 'Recording your route...'
                : 'Preparing trip...'}
            </Text>
          </View>
        </View>

        <TripMap routeCoords={routeCoords} currentLocation={currentLocation} isTracking={isTracking} height={320} />

        <View style={[styles.statsRow, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>DISTANCE</Text>
            <Text style={[styles.statValue, { color: t.accent }]}>{distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>TIME</Text>
            <Text style={[styles.statValue, { color: t.accent }]}>{isTracking ? timeStr : '0:00'}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>POINTS</Text>
            <Text style={[styles.statValue, { color: t.accent }]}>{routeCoords.length}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {permissionError ? (
            <>
              <Text style={[styles.errorText, { color: t.text }]}>{permissionError}</Text>
              <Button title="Go back" variant="secondary" onPress={handleCancel} fullWidth style={{ marginTop: 12 }} />
            </>
          ) : isTracking ? (
            <Button title="Stop & save trip" variant="danger" onPress={() => setShowClassify(true)} fullWidth />
          ) : (
            <>
              <View style={styles.acquiringRow}>
                <ActivityIndicator color={t.accent} />
                <Text style={[styles.acquiringText, { color: t.textMuted }]}>Acquiring GPS signal — this can take a few seconds</Text>
              </View>
              <Button title="Cancel" variant="secondary" onPress={handleCancel} fullWidth style={{ marginTop: 10 }} />
            </>
          )}
        </View>
      </View>

      <Modal visible={showClassify} transparent animationType="fade" onRequestClose={() => !saving && setShowClassify(false)}>
        <Pressable style={styles.overlay} onPress={() => !saving && setShowClassify(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: t.surface2 }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: t.text }]}>Was this a business or personal trip?</Text>
            <Text style={[styles.sheetSub, { color: t.textMuted }]}>This sets how the trip counts towards reimbursement.</Text>
            <Button title="Business" onPress={() => finishTrip('business')} loading={saving} fullWidth />
            <View style={{ height: 10 }} />
            <Button title="Personal" variant="secondary" onPress={() => finishTrip('personal')} fullWidth />
            <Pressable onPress={() => finishTrip(undefined)} disabled={saving} style={styles.later}>
              <Text style={[styles.laterText, { color: t.textMuted }]}>Decide later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingVertical: 24, paddingHorizontal: '15%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  badge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeLetter: { fontSize: 14, fontFamily: 'DMSans-Bold', letterSpacing: 0.5 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 24, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'DMSans-Regular', marginTop: 2 },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 20, marginTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, letterSpacing: 2, fontFamily: 'DMSans-Bold', marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: 'DMSans-Bold', letterSpacing: -0.5 },
  statDivider: { width: 1, marginHorizontal: 4 },
  actions: { marginTop: 'auto', paddingTop: 20 },
  acquiringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  acquiringText: { fontSize: 13, fontFamily: 'DMSans-Regular' },
  errorText: { fontSize: 14, fontFamily: 'DMSans-Regular', textAlign: 'center', lineHeight: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 24, letterSpacing: -0.5, marginBottom: 6 },
  sheetSub: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 19, marginBottom: 20 },
  later: { marginTop: 14, alignItems: 'center', paddingVertical: 6 },
  laterText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
});
