import { create } from "zustand";

/** Mock WebSocket-ready channel for UI demos (swap for real socket later). */
type RtState = {
  status: "idle" | "connecting" | "live" | "reconnecting";
  lastEvent: string | null;
  unread: number;
  setStatus: (s: RtState["status"]) => void;
  pushEvent: (msg: string) => void;
  bumpUnread: () => void;
  clearUnread: () => void;
};

export const useRealtimeStore = create<RtState>((set) => ({
  status: "idle",
  lastEvent: null,
  unread: 0,
  setStatus: (status) => set({ status }),
  pushEvent: (lastEvent) => set({ lastEvent }),
  bumpUnread: () => set((s) => ({ unread: s.unread + 1 })),
  clearUnread: () => set({ unread: 0 }),
}));
