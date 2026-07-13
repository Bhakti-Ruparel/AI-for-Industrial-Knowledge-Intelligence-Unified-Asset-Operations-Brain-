// ═══════════════════════════════════════════════════════════════════════════════
// Global UI State — Zustand Store
// Auth state is in use-auth-store.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import type { Notification } from "@/types";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  notifications: [],
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  clearNotifications: () => set({ notifications: [] }),

  theme: "dark",
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));
