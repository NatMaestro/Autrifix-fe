import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Mock WebSocket-ready channel for UI demos (swap for real socket later). */
type RtState = {
  status: "idle" | "connecting" | "live" | "reconnecting";
  lastEvent: string | null;
  unread: number;
  activeJobPath: string | null;
  activeJobLabel: string | null;
  pendingRequestId: string | null;
  pendingRequestServiceLabel: string | null;
  pendingRequestRadiusKm: number | null;
  setStatus: (s: RtState["status"]) => void;
  pushEvent: (msg: string) => void;
  bumpUnread: () => void;
  clearUnread: () => void;
  setActiveJob: (path: string, label: string) => void;
  clearActiveJob: () => void;
  setPendingRequest: (requestId: string | null) => void;
  setPendingRequestServiceLabel: (label: string | null) => void;
  setPendingRequestRadiusKm: (radiusKm: number | null) => void;
};

export const useRealtimeStore = create<RtState>()(
  persist(
    (set) => ({
      status: "idle",
      lastEvent: null,
      unread: 0,
      activeJobPath: null,
      activeJobLabel: null,
      pendingRequestId: null,
      pendingRequestServiceLabel: null,
      pendingRequestRadiusKm: null,
      setStatus: (status) => set({ status }),
      pushEvent: (lastEvent) => set({ lastEvent }),
      bumpUnread: () => set((s) => ({ unread: s.unread + 1 })),
      clearUnread: () => set({ unread: 0 }),
      setActiveJob: (activeJobPath, activeJobLabel) => set({ activeJobPath, activeJobLabel }),
      clearActiveJob: () => set({ activeJobPath: null, activeJobLabel: null }),
      setPendingRequest: (pendingRequestId) => set({ pendingRequestId }),
      setPendingRequestServiceLabel: (pendingRequestServiceLabel) => set({ pendingRequestServiceLabel }),
      setPendingRequestRadiusKm: (pendingRequestRadiusKm) => set({ pendingRequestRadiusKm }),
    }),
    { name: "autrifix-realtime" },
  ),
);
