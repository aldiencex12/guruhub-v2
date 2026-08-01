"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser, Role } from "@/types";

interface AuthStore {
  currentUser: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: CurrentUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  hasRole: (roles: Role[]) => boolean;
  canAccess: (allowedRoles: Role[]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user: CurrentUser, accessToken: string, refreshToken: string) => {
        set({ currentUser: user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ currentUser: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setAccessToken: (token: string | null) => {
        set({ accessToken: token });
      },

      setRefreshToken: (token: string | null) => {
        set({ refreshToken: token });
      },

      hasRole: (roles: Role[]) => {
        const user = get().currentUser;
        if (!user) return false;
        return roles.includes(user.role);
      },

      canAccess: (allowedRoles: Role[]) => {
        const user = get().currentUser;
        if (!user) return false;
        return allowedRoles.includes(user.role);
      },
    }),
    {
      name: "guruhub-auth",
      // Partialize to only persist refreshToken, currentUser and isAuthenticated.
      // accessToken is kept in-memory only (excluded from localStorage).
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
