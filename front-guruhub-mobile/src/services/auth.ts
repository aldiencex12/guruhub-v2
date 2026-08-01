import { api } from "./api";
import type { CurrentUser } from "@/types";

export const authService = {
  login: async (email: string, password: string) => {
    return api.post("/auth/login", { email, password });
  },


  refresh: async (refreshToken: string) => {
    return api.post("/auth/refresh", { refreshToken });
  },

  logout: async (refreshToken: string) => {
    return api.post("/auth/logout", { refreshToken });
  },

  getMe: async (): Promise<{ message: string; user: Omit<CurrentUser, "schoolName" | "name">; schoolName: string }> => {
    return api.get("/auth/protected/me");
  },
};
