import { api } from "./api";
import type { Subject, ApiResponse } from "@/types";

export const subjectsService = {
  getAll: async (params?: { gradeLevel?: string; status?: string; limit?: number }): Promise<Subject[]> => {
    let path = "/subjects/";
    const query = new URLSearchParams();
    if (params?.gradeLevel) query.append("gradeLevel", params.gradeLevel);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", String(params.limit));
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Subject[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<Subject> => {
    const res: ApiResponse<Subject> = await api.get(`/subjects/${id}`);
    return res.data;
  },

  create: async (data: Omit<Subject, "id" | "status">): Promise<Subject> => {
    const res: ApiResponse<Subject> = await api.post("/subjects/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Subject>): Promise<Subject> => {
    const res: ApiResponse<Subject> = await api.put(`/subjects/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.post(`/subjects/bulk-delete`, { ids });
  },
};
