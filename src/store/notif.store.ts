import { create } from "zustand";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  appointmentId?: string | null;
  createdAt: string;
}

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  polling: boolean;
  loaded: boolean;
  fetchCount: number;
  setNotifications: (notifs: Notification[]) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  startPolling: (intervalMs?: number) => () => void;
}

export const useNotifStore = create<NotifState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  polling: false,
  loaded: false,
  fetchCount: 0,

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),

  fetchNotifications: async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const notifs: Notification[] = data.notifications || [];
      set({ notifications: notifs, unreadCount: notifs.filter((n) => !n.isRead).length, loaded: true, fetchCount: get().fetchCount + 1 });
    } catch {
      set({ loaded: true, fetchCount: get().fetchCount + 1 });
      // silent
    }
  },

  markRead: async (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" }).catch(() => {});
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    await fetch("/api/notifications", { method: "PUT" }).catch(() => {});
  },

  startPolling: (intervalMs = 12000) => {
    const { fetchNotifications } = get();
    fetchNotifications();
    const id = setInterval(fetchNotifications, intervalMs);
    set({ polling: true });
    return () => {
      clearInterval(id);
      set({ polling: false });
    };
  },
}));