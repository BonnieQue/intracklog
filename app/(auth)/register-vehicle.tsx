import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useTheme } from '../../lib/useTheme';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useToastStore } from '../../stores/toastStore';

export default function RegisterVehicleScreen() {
  const router = useRouter();
  const { addVehicle } = useVehicleStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();
  const [regNo, setRegNo] = useState('');
  const [mileage, setMileage] = useState('');
  const [desc, setDesc] = useState('');

  const finish = async () => {
    const r = regNo.trim();
    const d = desc.trim();
    // Both fields required to create a vehicle. If user filled only one, ask — don't silently drop it.
    if (!r && !d) { toast.show('Please add a registration number and description, or skip for now.'); return; }
    if (!r) { toast.show('Please add the registration number.'); return; }
    if (!d) { toast.show('Please add a description (e.g. Toyota Hilux).'); return; }
    try {
      await addVehicle(d, r, d, Number(mileage) || 0);
      toast.show('Welcome to InTrackLog!');
      router.replace('/(main)/dashboard');
    } catch (e: any) { toast.show(e.message || 'Failed to add vehicle'); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.stepper}>
            <View style={styles.stepCol}><View style={[styles.stepDot, { backgroundColor: t.accent, borderColor: t.accent }]}><Text style={styles.check}>✓</Text></View><Text style={[styles.stepLabel, { color: t.text }]}>Account</Text></View>
            <View style={[styles.stepLine, { backgroundColor: t.accent }]} />
            <View style={styles.stepCol}><View style={[styles.stepDot, { backgroundColor: t.accent, borderColor: t.accent }]}><Text style={styles.stepNumActive}>2</Text></View><Text style={[styles.stepLabel, { color: t.text }]}>Vehicle</Text></View>
          </View>
          <Text style={[styles.title, { color: t.text }]}>Register your vehicle</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>Add your vehicle details to start tracking.</Text>
          <Input label="Registration number" value={regNo} onChangeText={setRegNo} placeholder="e.g. GP 123-456" autoCapitalize="characters" />
          <Input label="Starting mileage (km)" value={mileage} onChangeText={setMileage} placeholder="e.g. 45 230" keyboardType="numeric" />
          <Input label="Description" value={desc} onChangeText={setDesc} placeholder="e.g. Toyota Hilux 2.4 GD-6" />
          <Button title="Finish setup" onPress={finish} />
          <TouchableOpacity onPress={() => { toast.show('You can add vehicles later.'); router.replace('/(main)/dashboard'); }} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: t.textMuted }]}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { paddingHorizontal: '15%', paddingVertical: 24, paddingBottom: 40 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepCol: { alignItems: 'center', gap: 6 },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontFamily: 'DMSans-Bold', fontSize: 14, color: '#ffffff' },
  stepNumActive: { fontFamily: 'DMSans-Bold', fontSize: 13, color: '#ffffff' },
  stepLabel: { fontFamily: 'DMSans-Medium', fontSize: 11 },
  stepLine: { width: 40, height: 2, marginHorizontal: 8, marginBottom: 20 },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 28, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'DMSans-Regular', textAlign: 'center', marginBottom: 32 },
  skipBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  skipText: { fontSize: 14, fontFamily: 'DMSans-Medium' },
});
