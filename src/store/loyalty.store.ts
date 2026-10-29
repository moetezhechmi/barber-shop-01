import { create } from "zustand";

interface LoyaltyState {
  stamps: number;
  totalEarned: number;
  cardsCompleted: number;
  goal: number;
  isFreeReady: boolean;
  loading: boolean;
  fetchLoyalty: () => Promise<void>;
  reset: () => void;
}

export const useLoyaltyStore = create<LoyaltyState>((set) => ({
  stamps: 0,
  totalEarned: 0,
  cardsCompleted: 0,
  goal: 9,
  isFreeReady: false,
  loading: false,

  fetchLoyalty: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/loyalty");
      if (!res.ok) return;
      const data = await res.json();
      set({
        stamps: data.card?.stamps ?? 0,
        totalEarned: data.card?.totalEarned ?? 0,
        cardsCompleted: data.card?.cardsCompleted ?? 0,
        goal: data.goal ?? 9,
        isFreeReady: data.isFreeReady === true,
      });
    } catch {
      // silent
    } finally {
      set({ loading: false });
    }
  },

  reset: () =>
    set({ stamps: 0, totalEarned: 0, cardsCompleted: 0, isFreeReady: false }),
}));