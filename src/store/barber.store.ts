import { create } from "zustand";

export interface BarberProfile {
  id: string;
  userId: string;
  shopId: string | null;
  bio: string | null;
  isApproved: boolean;
  workingHours?: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  user?: { id: string; name: string; image: string | null };
}

interface BarberState {
  barber: BarberProfile | null;
  loading: boolean;
  initialized: boolean;
  fetchBarber: (force?: boolean) => Promise<void>;
  reset: () => void;
}

export const useBarberStore = create<BarberState>((set, get) => ({
  barber: null,
  loading: false,
  initialized: false,

  fetchBarber: async (force = false) => {
    const state = get();
    if (state.initialized && !force) return;
    if (state.loading) return;
    set({ loading: true });
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { set({ loading: false }); return; }
      const { user: me } = await meRes.json();

      const barberRes = await fetch("/api/barbers");
      if (!barberRes.ok) { set({ loading: false }); return; }
      const { barbers } = await barberRes.json();

      let myBarber: BarberProfile | undefined = barbers?.find(
        (b: BarberProfile) => b.userId === me.id
      );

      if (!myBarber && me.role === "BARBER") {
        const createRes = await fetch("/api/barbers", { method: "POST" });
        if (createRes.ok) {
          const refetchRes = await fetch("/api/barbers");
          if (refetchRes.ok) {
            const refetchData = await refetchRes.json();
            myBarber = refetchData.barbers?.find((b: BarberProfile) => b.userId === me.id);
          }
        }
      }

      set({ barber: myBarber ?? null, initialized: true });
    } catch {
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  reset: () => set({ barber: null, initialized: false, loading: false }),
}));