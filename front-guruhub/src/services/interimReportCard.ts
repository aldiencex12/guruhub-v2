import { api } from "./api";

export interface InterimSubjectGrade {
  studentId: number;
  tugas1?: number | null;
  tugas2?: number | null;
  sts?: number | null;
  notes?: string;
}

export interface BatchSavePayload {
  classId: number;
  subjectId: number;
  academicYearId: number;
  semester: "GANJIL" | "GENAP";
  grades: InterimSubjectGrade[];
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

export const interimReportCardService = {
  /** Generate / get interim report card for a student */
  generateOrGet: (payload: { studentId: number; academicYearId: number; semester: "GANJIL" | "GENAP" }) =>
    api.post("/interim-report-cards/generate", payload),

  /** Get detail of a specific interim report card */
  getById: (id: number) => api.get(`/interim-report-cards/${id}`),

  /** Get all interim report cards for a class */
  getClassReports: (classId: number, academicYearId: number, semester: "GANJIL" | "GENAP") =>
    api.get(`/interim-report-cards/class/${classId}${buildQuery({ academicYearId, semester })}`),

  /** Batch save interim grades for 1 subject + 1 class */
  batchSaveGrades: (payload: BatchSavePayload) =>
    api.post("/interim-report-cards/batch-grades", payload),

  /** Update homeroom notes & attendance for a report card */
  updateNotes: (id: number, data: { homeroomTeacherNotes?: string; sick?: number; permission?: number; absent?: number }) =>
    api.put(`/interim-report-cards/${id}/notes`, data),

  /** Download single interim report card PDF */
  downloadPdf: (interimReportCardId: number) =>
    api.openBlob(`/pdf/interim-report-card/${interimReportCardId}`),
};
