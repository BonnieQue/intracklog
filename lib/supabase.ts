import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart the dev server (or rebuild for EAS).',
  );
}

// During Expo Router static rendering, Node has no `window`, so AsyncStorage's
// localStorage-backed implementation throws. Use a memory shim in that case — there's no
// session to persist while pre-rendering pages anyway.
const memoryStorage = (() => {
  const data: Record<string, string> = {};
  return {
    getItem: async (key: string) => data[key] ?? null,
    setItem: async (key: string, value: string) => { data[key] = value; },
    removeItem: async (key: string) => { delete data[key]; },
  };
})();
const storage = typeof window === 'undefined' ? memoryStorage : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
