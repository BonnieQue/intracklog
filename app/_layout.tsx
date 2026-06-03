import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import Toast from '../components/ui/Toast';
import { useTheme } from '../lib/useTheme';
import { useThemeStore } from '../stores/themeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const loadSaved = useThemeStore((s) => s.loadSaved);

  useEffect(() => {
    ScreenOrientation.unlockAsync();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    'InstrumentSerif-Regular': require('../assets/fonts/InstrumentSerif-Regular.ttf'),
    'InstrumentSerif-Italic': require('../assets/fonts/InstrumentSerif-Italic.ttf'),
  });

  useEffect(() => {
    loadSaved();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayoutRootView}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
        <Stack.Screen name="(auth)/register" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
        <Stack.Screen name="(auth)/register-vehicle" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/dashboard" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
        <Stack.Screen name="(main)/vehicle-detail" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/entry-summary" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/trip-tracker" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom' }} />
        <Stack.Screen name="(main)/expense-report" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/privacy-policy" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/terms" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="(main)/help" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
        <Stack.Screen name="payment-success" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
        <Stack.Screen name="payment-cancel" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
        <Stack.Screen name="reset-password" options={{ animation: Platform.OS === 'web' ? 'none' : 'fade' }} />
      </Stack>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
