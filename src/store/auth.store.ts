import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  image?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  fetchUser: (force?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  fetchUser: async (force = false) => {
    const state = get();
    // Skip if already initialized (data is fresh) unless forced
    if (state.initialized && !force) return;
    // Skip if a fetch is already in progress
    if (state.loading) return;

    set({ loading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ user: null, initialized: true });
        return;
      }
      const data = await res.json();
      set({ user: data.user ?? null, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Full reset so next fetchUser will re-check
    set({ user: null, initialized: false, loading: false });
  },
}));