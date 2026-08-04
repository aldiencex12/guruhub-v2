import { api } from "./api";

export interface DisciplineCategory {
  id: number;
  code: string;
  name: string;
  category: string;
  severity: string;
  defaultPoints: number;
  description?: string;
}

export interface DisciplineType {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  severity: string;
  defaultPoints: number;
  description?: string;
}

export interface DisciplineIncident {
  id: number;
  schoolId: number;
  incidentDate: string;
  incidentTime?: string;
  location?: string;
  notes?: string;
  evidenceUrl?: string;
  status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESOLVED";
  demeritPoints: number;
  createdAt: string;
  student: {
    id: number;
    name: string;
    nisn?: string;
  };
  class?: {
    id: number;
    name: string;
  };
  type?: {
    id: number;
    name: string;
    code: string;
    severity: string;
  };
}

const buildQuery = (params?: Record<string, any>) => {
  if (!params) return "";
  const cleaned: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      cleaned[key] = String(val);
    }
  }
  const str = new URLSearchParams(cleaned).toString();
  return str ? `?${str}` : "";
};

export const disciplineService = {
  // Policy & Settings
  getPolicy: () => api.get("/discipline/policy"),
  updatePolicy: (data: any) => api.put("/discipline/policy", data),

  // Categories & Types
  getCategories: () => api.get("/discipline/categories"),
  createCategory: (data: any) => api.post("/discipline/categories", data),
  updateCategory: (id: number, data: any) => api.put(`/discipline/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/discipline/categories/${id}`),
  getTypes: (params?: any) => api.get(`/discipline/types${buildQuery(params)}`),
  createType: (data: any) => api.post("/discipline/types", data),
  updateType: (id: number, data: any) => api.put(`/discipline/types/${id}`, data),
  deleteType: (id: number) => api.delete(`/discipline/types/${id}`),

  // Incidents
  getIncidents: (params?: any) => api.get(`/discipline/incidents${buildQuery(params)}`),
  getIncidentById: (id: number) => api.get(`/discipline/incidents/${id}`),
  createIncident: (data: any) => api.post("/discipline/incidents", data),
  updateIncidentStatus: (id: number, data: { status: string; notes?: string }) =>
    api.put(`/discipline/incidents/${id}/status`, data),
  deleteIncident: (id: number) => api.delete(`/discipline/incidents/${id}`),

  // Legacy Violations Alias
  getViolations: (params?: any) => api.get(`/discipline/incidents${buildQuery(params)}`),
  getStudentRecap: (studentId: number, academicYearId?: number) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : "";
    return api.get(`/discipline/incidents/student-recap/${studentId}${query}`);
  },

  // Thresholds & Sanctions
  getThresholds: () => api.get("/discipline/thresholds"),
  createThreshold: (data: any) => api.post("/discipline/thresholds", data),
  updateThreshold: (id: number, data: any) => api.put(`/discipline/thresholds/${id}`, data),
  deleteThreshold: (id: number) => api.delete(`/discipline/thresholds/${id}`),
  getSanctions: (params?: any) => api.get(`/discipline/sanctions${buildQuery(params)}`),
  updateSanctionStatus: (id: number, data: { status: string; notes?: string }) =>
    api.put(`/discipline/sanctions/${id}`, data),
  downloadSanctionPdf: (sanctionId: number) =>
    api.download(`/pdf/sanctions/${sanctionId}`, `sanction-${sanctionId}.pdf`),

  // Audit Logs & Analytics
  getAuditLogs: (params?: any) => api.get(`/discipline/audit-logs${buildQuery(params)}`),
  getAnalytics: (params?: any) => api.get(`/discipline/analytics${buildQuery(params)}`),

  // Pleno Kenaikan Kelas
  getPlenoDecisions: (params?: any) => api.get(`/discipline/pleno${buildQuery(params)}`),
  overridePlenoDecision: (data: { studentId: number; academicYearId?: number; systemRecommendation: string; finalDecision: string; academicNotes?: string; attendanceNotes?: string; disciplineNotes?: string; overrideReason?: string }) =>
    api.post("/discipline/pleno/override", data),
  getStudentViolationDetails: (studentId: number) =>
    api.get(`/discipline/pleno/incidents/${studentId}`),
  getDemeritSummaryReport: () =>
    api.get("/discipline/demerit-summary"),

  // Counseling Schedules / Restorative Tasks
  getCounselingSchedules: () => api.get("/discipline/counseling-schedules"),
  createCounselingSchedule: (data: any) => api.post("/discipline/counseling-schedules", data),
  updateCounselingSchedule: (id: number, data: any) => api.put(`/discipline/counseling-schedules/${id}`, data),
  deleteCounselingSchedule: (id: number) => api.delete(`/discipline/counseling-schedules/${id}`),
};

