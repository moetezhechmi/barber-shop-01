import { create } from "zustand";

export type SSEEvent =
  | { type: "appointment_updated"; appointmentId: string; status: string; date: string; barberId: string }
  | { type: "slots_updated"; barberId: string; date: string }
  | { type: "connected"; userId: string };

interface SSEState {
  connected: boolean;
  lastEvent: SSEEvent | null;
  // Listeners registered by pages
  listeners: Set<(event: SSEEvent) => void>;
  addListener: (fn: (event: SSEEvent) => void) => () => void;
  connect: () => () => void;
}

export const useSSEStore = create<SSEState>((set, get) => ({
  connected: false,
  lastEvent: null,
  listeners: new Set(),

  addListener: (fn) => {
    get().listeners.add(fn);
    return () => get().listeners.delete(fn);
  },

  connect: () => {
    if (typeof window === "undefined") return () => {};

    const es = new EventSource("/api/sse");

    const dispatch = (event: SSEEvent) => {
      set({ lastEvent: event });
      get().listeners.forEach((fn) => fn(event));
    };

    es.addEventListener("connected", () => {
      set({ connected: true });
    });

    es.addEventListener("appointment_updated", (e) => {
      try {
        const data = JSON.parse(e.data);
        dispatch({ type: "appointment_updated", ...data });
      } catch {}
    });

    es.addEventListener("slots_updated", (e) => {
      try {
        const data = JSON.parse(e.data);
        dispatch({ type: "slots_updated", ...data });
      } catch {}
    });

    es.onerror = () => {
      set({ connected: false });
      // EventSource auto-reconnects on error
    };

    return () => {
      es.close();
      set({ connected: false });
    };
  },
}));