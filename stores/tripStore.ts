import { create } from 'zustand';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface TripState {
  isTracking: boolean;
  routeCoords: Coordinate[];
  startTime: Date | null;
  distanceKm: number;
  currentLocation: Coordinate | null;
  locationSubscription: Location.LocationSubscription | null;

  startTrip: () => Promise<{ error?: string }>;
  stopTrip: (vehicleId: string, tripType?: 'business' | 'personal') => Promise<{ entryId: string | null; error?: string }>;
  reset: () => void;
}

function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function placeName(geo?: Location.LocationGeocodedAddress): string {
  if (!geo) return '';
  const line1 =
    geo.name ||
    [geo.streetNumber, geo.street].filter(Boolean).join(' ') ||
    geo.street ||
    '';
  const line2 = geo.city || geo.subregion || geo.district || geo.region || '';
  return [line1, line2].filter(Boolean).join(', ');
}

function coordLabel(c: Coordinate): string {
  return `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
}

export const useTripStore = create<TripState>((set, get) => ({
  isTracking: false,
  routeCoords: [],
  startTime: null,
  distanceKm: 0,
  currentLocation: null,
  locationSubscription: null,

  startTrip: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { error: 'Location permission denied. Enable it in Settings.' };
    }

    const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const startCoord: Coordinate = {
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
    };

    set({
      isTracking: true,
      routeCoords: [startCoord],
      startTime: new Date(),
      distanceKm: 0,
      currentLocation: startCoord,
    });

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (location) => {
        const newCoord: Coordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const { routeCoords, distanceKm } = get();
        const lastCoord = routeCoords[routeCoords.length - 1];
        const segmentDist = lastCoord ? haversineDistance(lastCoord, newCoord) : 0;

        if (segmentDist > 0.01) {
          set({
            routeCoords: [...routeCoords, newCoord],
            distanceKm: distanceKm + segmentDist,
            currentLocation: newCoord,
          });
        } else {
          set({ currentLocation: newCoord });
        }
      }
    );

    set({ locationSubscription: sub });
    return {};
  },

  stopTrip: async (vehicleId, tripType) => {
    const { locationSubscription, routeCoords, distanceKm, startTime } = get();
    if (locationSubscription) locationSubscription.remove();
    set({ isTracking: false, locationSubscription: null });

    if (routeCoords.length < 2) return { entryId: null };

    // Reverse geocode start and end locations
    const startCoord = routeCoords[0];
    const endCoord = routeCoords[routeCoords.length - 1];
    let startName = '';
    let endName = '';
    try {
      startName = placeName((await Location.reverseGeocodeAsync(startCoord))[0]);
      endName = placeName((await Location.reverseGeocodeAsync(endCoord))[0]);
    } catch {}
    // Always record a start and an end. When the device can't resolve a street
    // address, fall back to coordinates so the report shows where, not a blank.
    if (!startName) startName = coordLabel(startCoord);
    if (!endName) endName = coordLabel(endCoord);

    const notesStr = `FROM: ${startName} → TO: ${endName}`;

    const { data, error } = await supabase
      .from('entries')
      .insert({
        vehicle_id: vehicleId,
        entry_date: (startTime || new Date()).toISOString(),
        trip_km: Math.round(distanceKm * 10) / 10,
        notes: notesStr,
        trip_type: tripType ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      return { entryId: null, error: error?.message || 'Could not save the trip. Please try again.' };
    }
    return { entryId: data.id };
  },

  reset: () => {
    const { locationSubscription } = get();
    if (locationSubscription) locationSubscription.remove();
    set({
      isTracking: false, routeCoords: [], startTime: null,
      distanceKm: 0, currentLocation: null, locationSubscription: null,
    });
  },
}));
