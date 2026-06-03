import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AttachmentGrid from '../../components/AttachmentGrid';
import { vehicleColors } from '../../constants/colors';
import { useTheme } from '../../lib/useTheme';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useEntryStore } from '../../stores/entryStore';
import { useToastStore } from '../../stores/toastStore';

const EXPENSE_TYPES = ['Fuel', 'Service', 'Tyres', 'Toll', 'Other'] as const;

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { vehicles } = useVehicleStore();
  const { draft, setDraft, saveEntry, loading, entries, fetchEntries } = useEntryStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  // Keep the vehicle's last logged odometer reading and pre-fill the start of
  // the next entry with it (still editable, so it can be corrected/updated).
  // Re-prefill whenever the last-reading number changes — e.g. after the user
  // saved an entry and comes back, we want the start to roll forward.
  const [lastReading, setLastReading] = useState(0);
  const [prefilledReading, setPrefilledReading] = useState(-1);

  useEffect(() => { if (vehicleId) fetchEntries(vehicleId); }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) return;
    const maxReading = entries
      .filter((e) => e.vehicle_id === vehicleId)
      .reduce((m, e) => Math.max(m, Number(e.reading_km) || 0), 0);
    const last = Math.max(maxReading, Number(vehicle?.start_mileage) || 0);
    setLastReading(last);
    if (last > 0 && last !== prefilledReading) {
      setDraft({ odometerStart: String(last) });
      setPrefilledReading(last);
    }
  }, [entries, vehicleId, vehicle?.start_mileage]);

  if (!vehicle) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontFamily: 'DMSans-Medium', fontSize: 16, color: t.textMuted }}>Vehicle not found</Text>
        <Button title="Go back" variant="secondary" onPress={() => router.replace('/(main)/dashboard')} />
      </View>
    </SafeAreaView>
  );
  const ci = vehicle.color_index ?? 0;
  const vc = vehicleColors[ci % vehicleColors.length];
  const name = vehicle.description || vehicle.name || 'Vehicle';

  const handleSave = async () => {
    try { const entry = await saveEntry(vehicle.id); toast.show('Entry saved!'); router.push({ pathname: '/(main)/entry-summary', params: { entryId: entry.id } }); }
    catch (e: any) { toast.show(e.message || 'Failed to save'); }
  };

  const handleStartTrip = () => {
    router.push({ pathname: '/(main)/trip-tracker', params: { vehicleId: vehicle.id } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.backText, { color: t.textMuted }]}>← Back</Text></TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.headerIcon, { backgroundColor: vc.tint }]}><Text style={[styles.headerIconText, { color: vc.solid }]}>{name.charAt(0)}</Text></View>
          <View><Text style={[styles.headerName, { color: t.text }]}>{name}</Text><Text style={[styles.headerReg, { color: t.textMuted }]}>{vehicle.reg_number || ''}</Text></View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* GPS Trip button */}
        <TouchableOpacity onPress={handleStartTrip} activeOpacity={0.8} style={[styles.tripBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={styles.tripIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tripTitle, { color: t.text }]}>Track a trip</Text>
            <Text style={[styles.tripSub, { color: t.textMuted }]}>Record your route with GPS</Text>
          </View>
          <Text style={[styles.tripArrow, { color: t.textMuted }]}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: t.text }]}>New entry</Text>
        <Input label="Date" value={draft.date} onChangeText={(v) => setDraft({ date: v })} placeholder="YYYY-MM-DD" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Input label="Odometer start (km)" value={draft.odometerStart} onChangeText={(v) => setDraft({ odometerStart: v })} placeholder="e.g. 45 230" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Odometer end (km)" value={draft.odometerEnd} onChangeText={(v) => setDraft({ odometerEnd: v })} placeholder="e.g. 45 380" keyboardType="numeric" /></View>
        </View>
        {lastReading > 0 ? (
          <Text style={[styles.odoHint, { color: t.textMuted }]}>
            Last logged odometer: <Text style={{ color: t.accent, fontFamily: 'DMSans-Bold' }}>{lastReading.toLocaleString()} km</Text> edit if it has changed.
          </Text>
        ) : null}
        {draft.odometerStart && draft.odometerEnd ? (
          <View style={[styles.distancePreview, { backgroundColor: t.accentBg }]}>
            <Text style={[styles.distanceLabel, { color: t.textMuted }]}>Distance</Text>
            <Text style={[styles.distanceVal, { color: t.accent }]}>{Math.max(0, (Number(draft.odometerEnd) || 0) - (Number(draft.odometerStart) || 0))} km</Text>
          </View>
        ) : null}
        <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Trip type (for reimbursement)</Text>
        <View style={styles.pillRow}>
          {(['business', 'personal'] as const).map((tt) => (
            <TouchableOpacity key={tt} onPress={() => setDraft({ tripType: draft.tripType === tt ? null : tt })} style={[styles.pill, { borderColor: t.border, backgroundColor: t.surface }, draft.tripType === tt && { backgroundColor: t.accent, borderColor: t.accent }]}>
              <Text style={[styles.pillText, { color: t.textMuted }, draft.tripType === tt && { color: '#ffffff' }]}>{tt.charAt(0).toUpperCase() + tt.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Expense type</Text>
        <View style={styles.pillRow}>
          {EXPENSE_TYPES.map((type) => (
            <TouchableOpacity key={type} onPress={() => setDraft({ expenseType: type })} style={[styles.pill, { borderColor: t.border, backgroundColor: t.surface }, draft.expenseType === type && { backgroundColor: t.accent, borderColor: t.accent }]}>
              <Text style={[styles.pillText, { color: t.textMuted }, draft.expenseType === type && { color: '#ffffff' }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Amount (R)" value={draft.amount} onChangeText={(v) => setDraft({ amount: v })} placeholder="e.g. 850.00" keyboardType="decimal-pad" />
        <Input label="Notes (optional)" value={draft.notes} onChangeText={(v) => setDraft({ notes: v })} placeholder="e.g. Filled up at Engen N1" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />

        <AttachmentGrid />

        <View style={{ marginTop: 16 }}><Button title="Save entry" onPress={handleSave} loading={loading} fullWidth /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1 },
  backText: { fontFamily: 'DMSans-Medium', fontSize: 14, marginBottom: 16 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontFamily: 'DMSans-Bold', fontSize: 15 },
  headerName: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  headerReg: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  scroll: { paddingHorizontal: '15%', paddingVertical: 24, paddingBottom: 40 },
  tripBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 24 },
  tripIcon: { fontSize: 24 },
  tripTitle: { fontFamily: 'DMSans-Bold', fontSize: 15 },
  tripSub: { fontFamily: 'DMSans-Regular', fontSize: 12, marginTop: 2 },
  tripArrow: { fontSize: 20 },
  sectionTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 26, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  odoHint: { fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 17, marginBottom: 16, marginTop: -4 },
  distancePreview: { borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  distanceLabel: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  distanceVal: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  fieldLabel: { fontFamily: 'DMSans-Medium', fontSize: 12, marginBottom: 10, letterSpacing: 0.3 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 50, borderWidth: 1 },
  pillText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
});
