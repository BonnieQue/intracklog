import { create } from 'zustand';
import { apiRegister, apiLogin, apiGetMe, apiLogout } from '../lib/api';
import { supabase } from '../lib/supabase';

interface User { id: string; full_name: string; email: string; }
interface RegisterResult { requiresVerification: boolean; }
interface AuthState {
  user: User | null; loading: boolean; error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, loading: false, error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await apiLogin(email, password);
      const user = await apiGetMe();
      set({ user, loading: false });
    } catch (e: any) { set({ loading: false, error: e.message }); throw e; }
  },
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRegister(name, email, password);
      // With email confirmation on, signUp returns no session — caller must show "check your email".
      if (!data.session) {
        set({ loading: false });
        return { requiresVerification: true };
      }
      const user = await apiGetMe();
      set({ user, loading: false });
      return { requiresVerification: false };
    } catch (e: any) { set({ loading: false, error: e.message }); throw e; }
  },
  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { set({ user: null, loading: false }); return; }
      const user = await apiGetMe();
      set({ user, loading: false });
    } catch { set({ user: null, loading: false }); }
  },
  logout: async () => { await apiLogout(); set({ user: null }); },
  clearError: () => set({ error: null }),
}));
