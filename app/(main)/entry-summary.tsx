import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useTheme } from '../../lib/useTheme';
import { useEntryStore } from '../../stores/entryStore';
import { useVehicleStore } from '../../stores/vehicleStore';

function Row({ label, value, accent, colors }: { label: string; value: string; accent?: boolean; colors: any }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[rowStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: accent ? colors.accent : colors.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  value: { fontFamily: 'DMSans-Medium', fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 },
});

export default function EntrySummaryScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { entries } = useEntryStore();
  const { vehicles } = useVehicleStore();
  const { colors: t } = useTheme();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontFamily: 'DMSans-Medium', fontSize: 16, color: t.textMuted }}>Entry not found</Text>
        <Button title="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
  const vehicle = vehicles.find((v) => v.id === entry.vehicle_id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.checkWrap}><View style={[styles.checkCircle, { backgroundColor: t.accentBg, borderColor: t.accent }]}><Text style={[styles.checkMark, { color: t.accent }]}>✓</Text></View></View>
        <Text style={[styles.title, { color: t.text }]}>Entry saved</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>Your trip for {vehicle?.description || vehicle?.name || 'vehicle'} has been logged.</Text>
        <Card style={styles.summaryCard}>
          {vehicle?.reg_number ? <Row label="Licence plate" value={vehicle.reg_number} colors={t} /> : null}
          <Row label="Date" value={new Date(entry.entry_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} colors={t} />
          <Row label="Distance" value={`${entry.trip_km || 0} km`} accent colors={t} />
          <Row label="Expense type" value={entry.expense_type || '-'} colors={t} />
          <Row label="Amount" value={`R ${(entry.amount || 0).toLocaleString()}`} accent colors={t} />
          {entry.notes ? <Row label="Notes" value={entry.notes} colors={t} /> : null}
        </Card>
        <View style={styles.actions}>
          <Button title="Back to dashboard" onPress={() => router.replace('/(main)/dashboard')} />
          <Button title="Log another entry" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { paddingHorizontal: '15%', paddingTop: 24, paddingBottom: 40 },
  checkWrap: { alignItems: 'center', marginBottom: 16 },
  checkCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 24 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 28, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: 'DMSans-Regular', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  summaryCard: { marginBottom: 28 },
  actions: { gap: 12 },
});
