import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (msg) => set({ message: msg, visible: true }),
  hide: () => set({ visible: false }),
}));
