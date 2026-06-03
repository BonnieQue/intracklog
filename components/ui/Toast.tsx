import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { useToastStore } from '../../stores/toastStore';

export default function Toast() {
  const { message, visible, hide } = useToastStore();
  const { colors: t } = useTheme();
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(hide, 3000);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { backgroundColor: t.accent, transform: [{ translateY }], opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', bottom: 40, left: 24, right: 24, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', zIndex: 999 },
  text: { fontFamily: 'DMSans-Medium', fontSize: 15, color: '#ffffff' },
});
