import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "driver" | "mechanic" | "admin";

export type AuthUser = {
  id: string;
  phone: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  avatar?: string | null;
};

type AuthState = {
  hydrated: boolean;
  access: string | null;
  refresh: string | null;
  user: AuthUser | null;
  pendingPhone: string | null;
  setHydrated: (hydrated: boolean) => void;
  setPendingPhone: (phone: string | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setSession: (access: string, refresh: string, user: AuthUser) => void;
  patchUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      access: null,
      refresh: null,
      user: null,
      pendingPhone: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setPendingPhone: (pendingPhone) => set({ pendingPhone }),
      setTokens: (access, refresh) => set({ access, refresh }),
      setSession: (access, refresh, user) =>
        set({ access, refresh, user, pendingPhone: null }),
      patchUser: (patch) =>
        set((s) =>
          s.user ? { user: { ...s.user, ...patch } } : { user: null },
        ),
      logout: () =>
        set({ access: null, refresh: null, user: null, pendingPhone: null }),
    }),
    {
      name: "autrifix-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
