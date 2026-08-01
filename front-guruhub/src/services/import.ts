import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface ImportResponseData {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export type EntityType = "teachers" | "classes" | "subjects" | "students" | "class-members" | "schedules";

export const importService = {
  // Upload Functions
  uploadTeachers: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/teachers", formData);
    return res.data;
  },

  uploadClasses: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/classes", formData);
    return res.data;
  },

  uploadSubjects: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/subjects", formData);
    return res.data;
  },

  uploadStudents: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/students", formData);
    return res.data;
  },

  uploadClassMembers: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/class-members", formData);
    return res.data;
  },

  uploadSchedules: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/schedules", formData);
    return res.data;
  },

  // Template Download Functions
  downloadTemplate: (type: EntityType) => {
    return api.download(`/import/templates/${type}`, `template-${type}.xlsx`);
  }
};
