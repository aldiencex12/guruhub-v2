import { api } from "./api";
import type { AssessmentCategory, ApiResponse } from "@/types";

export const assessmentCategoriesService = {
  getAll: async (): Promise<AssessmentCategory[]> => {
    const res: ApiResponse<AssessmentCategory[]> = await api.get("/assessment-categories/");
    return res.data;
  },

  getById: async (id: number): Promise<AssessmentCategory> => {
    const res: ApiResponse<AssessmentCategory> = await api.get(`/assessment-categories/${id}`);
    return res.data;
  },

  create: async (data: Omit<AssessmentCategory, "id" | "isActive">): Promise<AssessmentCategory> => {
    const res: ApiResponse<AssessmentCategory> = await api.post("/assessment-categories/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<AssessmentCategory>): Promise<AssessmentCategory> => {
    const res: ApiResponse<AssessmentCategory> = await api.put(`/assessment-categories/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/assessment-categories/${id}`);
  },
};
