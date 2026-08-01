import { api } from "./api";

export const disciplineService = {
  // --- Policy ---
  getPolicy: () => api.get("/discipline/policy"),

  // --- Categories ---
  getCategories: (params?: { search?: string; isActive?: boolean }) => {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return api.get(`/discipline/categories${query}`);
  },
  createCategory: (data: { name: string; description?: string }) =>
    api.post("/discipline/categories", data),
  updateCategory: (id: number, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/discipline/categories/${id}`, data),

  // --- Types / Violations ---
  getTypes: (params?: { search?: string; categoryId?: number; isActive?: boolean }) => {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return api.get(`/discipline/types${query}`);
  },
  createType: (data: { name: string; categoryId: number; points: number; description?: string }) =>
    api.post("/discipline/types", data),
  updateType: (id: number, data: { name?: string; points?: number; isActive?: boolean }) =>
    api.put(`/discipline/types/${id}`, data),

  // --- Incidents ---
  getIncidents: (params?: {
    studentId?: number;
    classId?: number;
    academicYearId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return api.get(`/discipline/incidents${query}`);
  },
  createIncident: (data: any) => api.post("/discipline/incidents", data),
  updateIncidentStatus: (id: number, data: { status: string; notes?: string }) =>
    api.put(`/discipline/incidents/${id}/status`, data),

  // --- Sanctions ---
  getSanctionThresholds: () => api.get("/discipline/thresholds"),
  getSanctionLogs: (params?: {
    studentId?: number;
    classId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return api.get(`/discipline/sanctions${query}`);
  },
  updateSanctionStatus: (id: number, data: { status: string; notes?: string }) =>
    api.put(`/discipline/sanctions/${id}`, data),

  // --- Analytics ---
  getAnalytics: (params?: { classId?: number; academicYearId?: number }) => {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return api.get(`/discipline/analytics${query}`);
  },

  // --- Aliases for Mobile Hooks ---
  getViolations: (params?: any) => disciplineService.getIncidents(params),
  createViolation: (data: any) => disciplineService.createIncident(data),
};

export const mobileAuxService = {
  getClasses: () => api.get("/classes"),
  getStudents: (classId?: number) => {
    const query = classId ? `?classId=${classId}` : "";
    return api.get(`/students${query}`);
  },
  getAcademicYears: () => api.get("/academic-years"),
};
