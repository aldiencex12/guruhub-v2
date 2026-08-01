import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface ImportResponseData {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export const importService = {
  uploadTeachers: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/teachers", formData);
    return res.data;
  },

  uploadStudents: async (file: File): Promise<ImportResponseData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res: ApiResponse<ImportResponseData> = await api.post("/import/students", formData);
    return res.data;
  },
};
