import { api } from "./api";
import type { ReportCard, ApiResponse } from "@/types";

export const reportCardsService = {
  getAll: async (params?: {
    classId?: number;
    academicYearId?: number;
    semester?: string;
    status?: string;
  }): Promise<ReportCard[]> => {
    let path = "/report-cards/";
    const query = new URLSearchParams();
    if (params?.classId) query.append("classId", String(params.classId));
    if (params?.academicYearId) query.append("academicYearId", String(params.academicYearId));
    if (params?.semester) query.append("semester", params.semester);
    if (params?.status) query.append("status", params.status);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<ReportCard[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<ReportCard> => {
    const res: ApiResponse<ReportCard> = await api.get(`/report-cards/${id}`);
    return res.data;
  },

  create: async (data: {
    studentId: number;
    academicYearId: number;
    semester: string;
  }): Promise<ReportCard> => {
    const res: ApiResponse<ReportCard> = await api.post("/report-cards/generate", data);
    return res.data;
  },

  update: async (id: number, data: Partial<ReportCard>): Promise<ReportCard> => {
    const res: ApiResponse<ReportCard> = await api.put(`/report-cards/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/report-cards/${id}`);
  },

  publish: async (id: number): Promise<any> => {
    return api.post(`/report-cards/${id}/publish`);
  },
};
