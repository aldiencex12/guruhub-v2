import { api } from "./api";
import type { ApiResponse } from "@/types";

export const gradeEngineService = {
  calculateClass: async (data: {
    classId: number;
    subjectId: number;
    academicYearId: number;
  }): Promise<any[]> => {
    const res: ApiResponse<any[]> = await api.post("/grade-engine/calculate-class", data);
    return res.data;
  },

  calculateStudent: async (data: {
    studentId: number;
    subjectId: number;
    academicYearId: number;
  }): Promise<any> => {
    const res: ApiResponse<any> = await api.post("/grade-engine/calculate", data);
    return res.data;
  },

  getStudentGrades: async (
    studentId: number,
    params: { subjectId: number; academicYearId: number }
  ): Promise<any> => {
    const res: ApiResponse<any> = await api.get(
      `/grade-engine/student/${studentId}?subjectId=${params.subjectId}&academicYearId=${params.academicYearId}`
    );
    return res.data;
  },
};
