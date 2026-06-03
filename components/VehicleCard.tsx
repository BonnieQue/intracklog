import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { vehicleColors } from '../constants/colors';
import { useTheme } from '../lib/useTheme';

interface Vehicle { id: string; name?: string | null; description?: string | null; reg_number?: string | null; regNo?: string; licence_plate?: string | null; color_index?: number; colorIndex?: number; start_mileage?: number | null; currentMileage?: number; }

export default function VehicleCard({ vehicle, onPress }: { vehicle: Vehicle; onPress: () => void }) {
  const { colors: t } = useTheme();
  const ci = vehicle.color_index ?? vehicle.colorIndex ?? 0;
  const vc = vehicleColors[ci % vehicleColors.length];
  const name = vehicle.description || vehicle.name || 'Vehicle';
  const plate = vehicle.reg_number || vehicle.regNo || '';
  const km = vehicle.start_mileage ?? vehicle.currentMileage ?? 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={[styles.icon, { backgroundColor: vc.tint }]}>
        <Text style={[styles.iconText, { color: vc.solid }]}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: t.text }]}>{name}</Text>
        {plate ? <Text style={[styles.reg, { color: t.textMuted }]}>{plate}</Text> : null}
      </View>
      <View style={styles.mileage}>
        <Text style={[styles.km, { color: vc.solid }]}>{km.toLocaleString()} km</Text>
        <Text style={[styles.odoLabel, { color: t.textMuted }]}>odometer</Text>
      </View>
      <Text style={[styles.arrow, { color: t.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

export function AddVehicleCard({ onPress }: { onPress: () => void }) {
  const { colors: t } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.addCard, { borderColor: t.border }]}>
      <View style={[styles.addIcon, { borderColor: t.textMuted }]}><Text style={[styles.addPlus, { color: t.textMuted }]}>+</Text></View>
      <Text style={[styles.addText, { color: t.textMuted }]}>Add vehicle</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontFamily: 'DMSans-Bold', fontSize: 14 },
  info: { flex: 1 },
  name: { fontFamily: 'DMSans-Bold', fontSize: 18, marginBottom: 2 },
  reg: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  mileage: { alignItems: 'flex-end' },
  km: { fontFamily: 'DMSans-Bold', fontSize: 14 },
  odoLabel: { fontFamily: 'DMSans-Regular', fontSize: 10 },
  arrow: { fontSize: 16, marginLeft: 4 },
  addCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPlus: { fontSize: 22 },
  addText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
});
