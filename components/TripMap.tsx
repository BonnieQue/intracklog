import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/useTheme';
import { Coordinate } from '../stores/tripStore';

interface TripMapProps {
  routeCoords: Coordinate[];
  currentLocation?: Coordinate | null;
  isTracking?: boolean;
  height?: number;
}

export default function TripMap({ routeCoords, isTracking, height = 250 }: TripMapProps) {
  const { colors: t } = useTheme();
  return (
    <View style={[styles.container, { height, borderColor: t.border, backgroundColor: t.surface2 }]}>
      <View style={styles.inner}>
        {routeCoords.length > 0 ? (
          <>
            <View style={[styles.routeLine, { backgroundColor: t.accent }]} />
            <View style={styles.startDot} />
            <View style={[styles.endDot, isTracking && { backgroundColor: t.accent }]} />
            <Text style={[styles.label, { color: t.textMuted }]}>{routeCoords.length} GPS points recorded</Text>
          </>
        ) : (
          <Text style={[styles.label, { color: t.textMuted }]}>Waiting for GPS signal...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { width: '80%', height: '60%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: '100%', height: 3, borderRadius: 2, opacity: 0.6 },
  startDot: { position: 'absolute', left: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#5DCAA5' },
  endDot: { position: 'absolute', right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#F0997B' },
  label: { position: 'absolute', bottom: -24, fontSize: 11, fontFamily: 'DMSans-Regular' },
});
