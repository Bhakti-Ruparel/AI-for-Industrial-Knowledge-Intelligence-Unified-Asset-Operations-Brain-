// ═══════════════════════════════════════════════════════════════════════════════
// Global State — Zustand Store
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import type { User, Notification } from "@/types";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;

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

  user: {
    id: "1",
    name: "Admin User",
    email: "admin@cosmoscnc.com",
    role: "admin",
  },
  setUser: (user) => set({ user }),

  notifications: [
    { id: "1", title: "Maintenance Overdue", message: "SURFGRIND-600 maintenance is 22 days overdue", type: "warning", read: false, timestamp: new Date().toISOString(), actionUrl: "/maintenance" },
    { id: "2", title: "New Lead", message: "Hot lead received - Automotive Die Mould", type: "success", read: false, timestamp: new Date(Date.now() - 3600000).toISOString(), actionUrl: "/dashboard" },
    { id: "3", title: "Compliance Alert", message: "ISO 9001 audit due in 15 days", type: "info", read: true, timestamp: new Date(Date.now() - 86400000).toISOString(), actionUrl: "/compliance" },
  ],
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  clearNotifications: () => set({ notifications: [] }),

  theme: "dark",
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));
