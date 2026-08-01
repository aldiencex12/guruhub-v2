import { api } from "./api";
import type { Teacher, ApiResponse } from "@/types";

export const teachersService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<Teacher[]> => {
    let path = "/teachers/";
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Teacher[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<Teacher> => {
    const res: ApiResponse<Teacher> = await api.get(`/teachers/${id}`);
    return res.data;
  },

  create: async (data: Omit<Teacher, "id" | "status" | "createdAt">): Promise<Teacher> => {
    const res: ApiResponse<Teacher> = await api.post("/teachers/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Teacher>): Promise<Teacher> => {
    const res: ApiResponse<Teacher> = await api.put(`/teachers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },
};
