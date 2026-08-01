import { api } from "./api";
import type { Class, ApiResponse } from "@/types";

export const classesService = {
  getAll: async (params?: { academicYearId?: number; gradeLevel?: string; status?: string; limit?: number }): Promise<Class[]> => {
    let path = "/classes/";
    const query = new URLSearchParams();
    if (params?.academicYearId) query.append("academicYearId", String(params.academicYearId));
    if (params?.gradeLevel) query.append("gradeLevel", params.gradeLevel);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", String(params.limit));
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Class[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<Class> => {
    const res: ApiResponse<Class> = await api.get(`/classes/${id}`);
    return res.data;
  },

  create: async (data: { name: string; gradeLevel: string; academicYearId: number; homeroomTeacherId?: number }): Promise<Class> => {
    const res: ApiResponse<Class> = await api.post("/classes/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Class>): Promise<Class> => {
    const res: ApiResponse<Class> = await api.put(`/classes/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.post(`/classes/bulk-delete`, { ids });
  },
};
