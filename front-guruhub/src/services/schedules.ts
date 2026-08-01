import { api } from "./api";
import type { Schedule, ApiResponse } from "@/types";

export const schedulesService = {
  getAll: async (params?: { classId?: number; teacherId?: number; academicYearId?: number; dayOfWeek?: string }): Promise<Schedule[]> => {
    let path = "/schedules/";
    const query = new URLSearchParams();
    if (params?.classId) query.append("classId", String(params.classId));
    if (params?.teacherId) query.append("teacherId", String(params.teacherId));
    if (params?.academicYearId) query.append("academicYearId", String(params.academicYearId));
    if (params?.dayOfWeek) query.append("dayOfWeek", params.dayOfWeek);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Schedule[]> = await api.get(path);
    return res.data;
  },

  create: async (data: Omit<Schedule, "id" | "class" | "subject" | "teacher" | "academicYear">): Promise<Schedule> => {
    const res: ApiResponse<Schedule> = await api.post("/schedules/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Schedule>): Promise<Schedule> => {
    const res: ApiResponse<Schedule> = await api.put(`/schedules/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/schedules/${id}`);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await api.post("/schedules/bulk-delete", { ids });
  },

  deleteAll: async (): Promise<void> => {
    await api.delete("/schedules/delete-all");
  },
};
