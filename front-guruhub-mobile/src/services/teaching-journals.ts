import { api } from "./api";
import type { TeachingJournal, ApiResponse } from "@/types";

export const teachingJournalsService = {
  getAll: async (params?: { teacherId?: number; scheduleId?: number; startDate?: string; endDate?: string }): Promise<TeachingJournal[]> => {
    let path = "/teaching-journals/";
    const query = new URLSearchParams();
    if (params?.teacherId) query.append("teacherId", String(params.teacherId));
    if (params?.scheduleId) query.append("scheduleId", String(params.scheduleId));
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<TeachingJournal[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<TeachingJournal> => {
    const res: ApiResponse<TeachingJournal> = await api.get(`/teaching-journals/${id}`);
    return res.data;
  },

  create: async (data: Omit<TeachingJournal, "id" | "schedule" | "createdAt">): Promise<TeachingJournal> => {
    const res: ApiResponse<TeachingJournal> = await api.post("/teaching-journals/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<TeachingJournal>): Promise<TeachingJournal> => {
    const res: ApiResponse<TeachingJournal> = await api.put(`/teaching-journals/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teaching-journals/${id}`);
  },
};
