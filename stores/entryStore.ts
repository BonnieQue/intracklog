import { create } from 'zustand';
import { apiListEntries, apiCreateEntry, apiUpdateEntry, apiDeleteEntry, apiUploadAttachment, apiDeleteAttachment, EntryResponse, AttachmentResponse } from '../lib/api';

type ExpenseType = 'Fuel' | 'Service' | 'Tyres' | 'Toll' | 'Other';
interface EntryDraft { date: string; odometerStart: string; odometerEnd: string; expenseType: ExpenseType; amount: string; notes: string; tripType: 'business' | 'personal' | null; }

interface LocalAttachment {
  id: string; entryId: string; fileName: string; fileType: string; uri: string; createdAt: string;
}

interface EntryState {
  entries: EntryResponse[]; loading: boolean; error: string | null; draft: EntryDraft;
  attachments: LocalAttachment[];
  fetchEntries: (vehicleId: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  saveEntry: (vehicleId: string) => Promise<EntryResponse>;
  deleteEntry: (entryId: string) => Promise<void>;
  uploadAttachment: (entryId: string, file: { uri: string; name: string; type: string }) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  addAttachment: (att: LocalAttachment) => void;
  removeAttachment: (id: string) => void;
  setDraft: (partial: Partial<EntryDraft>) => void;
  resetDraft: () => void;
}

const EMPTY_DRAFT: EntryDraft = { date: new Date().toISOString().slice(0, 10), odometerStart: '', odometerEnd: '', expenseType: 'Fuel', amount: '', notes: '', tripType: null };

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [], loading: false, error: null, draft: { ...EMPTY_DRAFT },
  attachments: [],
  fetchEntries: async (vehicleId, dateFrom, dateTo) => {
    set({ loading: true, error: null });
    try { const entries = await apiListEntries(vehicleId, dateFrom, dateTo); set({ entries, loading: false }); }
    catch (e: any) { set({ loading: false, error: e.message }); }
  },
  saveEntry: async (vehicleId) => {
    set({ loading: true, error: null });
    const d = get().draft;
    const localAttachments = get().attachments;
    try {
      const tripKm = Math.max(0, (Number(d.odometerEnd) || 0) - (Number(d.odometerStart) || 0));
      const entry = await apiCreateEntry(vehicleId, {
        entry_date: d.date, reading_km: Number(d.odometerEnd) || 0,
        trip_km: tripKm,
        trip_type: tripKm > 0 ? d.tripType ?? null : null,
        expense_type: d.expenseType, amount: Number(d.amount) || 0, notes: d.notes || undefined,
      });
      // Upload any local attachments
      for (const att of localAttachments) {
        try {
          await apiUploadAttachment(entry.id, { uri: att.uri, name: att.fileName, type: att.fileType });
        } catch { /* continue even if one fails */ }
      }
      set((state) => ({ entries: [entry, ...state.entries], loading: false, attachments: [] }));
      return entry;
    } catch (e: any) { set({ loading: false, error: e.message }); throw e; }
  },
  deleteEntry: async (entryId) => {
    try { await apiDeleteEntry(entryId); set((state) => ({ entries: state.entries.filter((e) => e.id !== entryId) })); }
    catch (e: any) { set({ error: e.message }); throw e; }
  },
  uploadAttachment: async (entryId, file) => {
    try { await apiUploadAttachment(entryId, file); const entries = get().entries; const entry = entries.find((e) => e.id === entryId);
      if (entry) { const updated = await apiListEntries(entry.vehicle_id); set({ entries: updated }); }
    } catch (e: any) { set({ error: e.message }); throw e; }
  },
  deleteAttachment: async (attachmentId) => {
    try { await apiDeleteAttachment(attachmentId); } catch (e: any) { set({ error: e.message }); throw e; }
  },
  addAttachment: (att) => set((state) => ({ attachments: [...state.attachments, att] })),
  removeAttachment: (id) => set((state) => ({ attachments: state.attachments.filter((a) => a.id !== id) })),
  setDraft: (partial) => set((state) => ({ draft: { ...state.draft, ...partial } })),
  resetDraft: () => set({ draft: { ...EMPTY_DRAFT }, attachments: [] }),
}));
