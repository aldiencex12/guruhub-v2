import { api } from "./api";
import type { DashboardSummary, ApiResponse, AcademicYear } from "@/types";

export interface StudentHighlight {
  topStudents: { name: string; class: string; score: number }[];
  attentionStudents: { name: string; class: string; alfas: number }[];
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res: ApiResponse<DashboardSummary> = await api.get("/dashboard/summary");
    return res.data;
  },

  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const res: ApiResponse<any[]> = await api.get("/dashboard/academic-years");
    return res.data.map(item => ({
      id: item.id,
      name: item.year || item.name,
      semester: item.semester,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      isActive: item.isActive,
    }));
  },

  getAttendance: async (): Promise<{ hadirHariIni: number, sakitHariIni: number, izinHariIni: number, alfaHariIni: number }> => {
    const res: ApiResponse<any> = await api.get("/dashboard/attendance");
    return res.data;
  },

  getActivities: async (): Promise<{ id: string, type: string, message: string, time: string }[]> => {
    const res: ApiResponse<any[]> = await api.get("/dashboard/activities");
    return res.data;
  },

  getPendingTasks: async (): Promise<{ type: string, scheduleId: number, subjectName: string, className: string, time: string }[]> => {
    const res: ApiResponse<any[]> = await api.get("/dashboard/pending-tasks");
    return res.data;
  },

  getStudentHighlights: async (): Promise<StudentHighlight> => {
    try {
      const res: ApiResponse<StudentHighlight> = await api.get("/dashboard/student-highlights");
      if (res && res.data) return res.data;
    } catch (error) {
      // Fallback to mock data if API is not yet implemented
      console.warn("Fallback to mock data for student highlights");
    }
    
    return {
      topStudents: [
        { name: "Budi Santoso", class: "7A", score: 95 },
        { name: "Siti Aminah", class: "8B", score: 92 },
        { name: "Ahmad Fauzi", class: "7A", score: 90 },
      ],
      attentionStudents: [
        { name: "Reza Rahadian", class: "7A", alfas: 5 },
        { name: "Dewi Lestari", class: "9C", alfas: 3 },
      ]
    };
  },
};
