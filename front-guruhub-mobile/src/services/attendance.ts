import { api } from "./api";
import type { Attendance, ApiResponse } from "@/types";

export const attendanceService = {
  getAll: async (params?: { scheduleId?: number; attendanceDate?: string; teacherId?: number; classId?: number }): Promise<Attendance[]> => {
    let path = "/attendances/";
    const query = new URLSearchParams();
    if (params?.scheduleId) query.append("scheduleId", String(params.scheduleId));
    if (params?.attendanceDate) query.append("date", params.attendanceDate);
    if (params?.teacherId) query.append("teacherId", String(params.teacherId));
    if (params?.classId) query.append("classId", String(params.classId));
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Attendance[]> = await api.get(path);
    return res.data;
  },

  getRecap: async (classId: number, month: string): Promise<any> => {
    const res: ApiResponse<any> = await api.get(`/attendances/recap?classId=${classId}&month=${month}`);
    return res.data;
  },

  getById: async (id: number): Promise<Attendance> => {
    const res: ApiResponse<Attendance> = await api.get(`/attendances/${id}`);
    return res.data;
  },

  create: async (data: {
    scheduleId: number;
    attendanceDate: string;
    notes?: string;
    details: Array<{ studentId: number; status: string; notes?: string }>;
  }): Promise<Attendance> => {
    const res: ApiResponse<Attendance> = await api.post("/attendances/", data);
    return res.data;
  },

  update: async (
    id: number,
    data: {
      notes?: string;
      details: Array<{ studentId: number; status: string; notes?: string }>;
    }
  ): Promise<Attendance> => {
    const res: ApiResponse<Attendance> = await api.put(`/attendances/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/attendances/${id}`);
  },
};
