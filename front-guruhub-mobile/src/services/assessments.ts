import { api } from "./api";
import type { Assessment, ApiResponse } from "@/types";

export const assessmentsService = {
  getAll: async (params?: {
    classId?: number;
    subjectId?: number;
    teacherId?: number;
    academicYearId?: number;
    assessmentType?: string;
  }): Promise<Assessment[]> => {
    let path = "/assessments/";
    const query = new URLSearchParams();
    if (params?.classId) query.append("classId", String(params.classId));
    if (params?.subjectId) query.append("subjectId", String(params.subjectId));
    if (params?.teacherId) query.append("teacherId", String(params.teacherId));
    if (params?.academicYearId) query.append("academicYearId", String(params.academicYearId));
    if (params?.assessmentType) query.append("assessmentType", params.assessmentType);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Assessment[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<Assessment> => {
    const res: ApiResponse<Assessment> = await api.get(`/assessments/${id}`);
    return res.data;
  },

  create: async (data: {
    classId: number;
    subjectId: number;
    teacherId?: number;
    academicYearId?: number;
    categoryId: number;
    title: string;
    description?: string;
    assessmentType: string;
    assessmentDate: string;
    maxScore: number;
    scores?: Array<{ studentId: number; score: number; notes?: string }>;
  }): Promise<Assessment> => {
    const res: ApiResponse<Assessment> = await api.post("/assessments/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Assessment>): Promise<Assessment> => {
    const res: ApiResponse<Assessment> = await api.put(`/assessments/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  },

  saveScores: async (
    id: number,
    scores: Array<{ studentId: number; score: number; notes?: string }>
  ): Promise<any> => {
    return api.post(`/assessments/${id}/scores`, { scores });
  },
};
