import { create } from 'zustand';
import { apiListVehicles, apiCreateVehicle, apiUpdateVehicle, apiDeleteVehicle, VehicleResponse } from '../lib/api';

interface VehicleState {
  vehicles: VehicleResponse[]; loading: boolean; error: string | null;
  fetchVehicles: () => Promise<void>;
  addVehicle: (name: string, regNumber: string, description: string, mileage: number, licencePlate?: string) => Promise<void>;
  updateVehicle: (id: string, data: Partial<{ name: string; reg_number: string; licence_plate: string; description: string; start_mileage: number }>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  getVehicle: (id: string) => VehicleResponse | undefined;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [], loading: false, error: null,
  fetchVehicles: async () => {
    set({ loading: true, error: null });
    try { const vehicles = await apiListVehicles(); set({ vehicles, loading: false }); }
    catch (e: any) { set({ loading: false, error: e.message }); }
  },
  addVehicle: async (name, regNumber, description, mileage, licencePlate) => {
    set({ loading: true, error: null });
    try {
      const vehicle = await apiCreateVehicle({ name, reg_number: regNumber, licence_plate: licencePlate, description, start_mileage: mileage });
      set((state) => ({ vehicles: [...state.vehicles, vehicle], loading: false }));
    } catch (e: any) { set({ loading: false, error: e.message }); throw e; }
  },
  updateVehicle: async (id, data) => {
    try { const updated = await apiUpdateVehicle(id, data); set((state) => ({ vehicles: state.vehicles.map((v) => (v.id === id ? updated : v)) })); }
    catch (e: any) { set({ error: e.message }); throw e; }
  },
  deleteVehicle: async (id) => {
    try { await apiDeleteVehicle(id); set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })); }
    catch (e: any) { set({ error: e.message }); throw e; }
  },
  getVehicle: (id) => get().vehicles.find((v) => v.id === id),
}));
