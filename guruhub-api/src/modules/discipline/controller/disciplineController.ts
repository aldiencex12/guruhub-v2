import { DisciplineService } from "../service/disciplineService";

const service = new DisciplineService();

export const disciplineController = {
  // --- Policies ---
  getPolicy: async ({ schoolId }: any) => {
    const data = await service.getPolicy(schoolId);
    return {
      success: true,
      message: "Kebijakan disiplin berhasil diambil",
      data
    };
  },

  updatePolicy: async ({ schoolId, body }: any) => {
    const data = await service.updatePolicy(schoolId, body);
    return {
      success: true,
      message: "Kebijakan disiplin berhasil diperbarui",
      data
    };
  },

  // --- Categories ---
  getCategories: async ({ schoolId, query }: any) => {
    const data = await service.getCategories(schoolId, query);
    return {
      success: true,
      message: "Kategori disiplin berhasil diambil",
      data
    };
  },

  createCategory: async ({ schoolId, body }: any) => {
    const data = await service.createCategory(schoolId, body);
    return { success: true, message: "Kategori disiplin berhasil dibuat", data };
  },

  updateCategory: async ({ schoolId, params, body }: any) => {
    const data = await service.updateCategory(schoolId, Number(params.id), body);
    return { success: true, message: "Kategori disiplin berhasil diperbarui", data };
  },

  deleteCategory: async ({ schoolId, params }: any) => {
    await service.deleteCategory(schoolId, Number(params.id));
    return { success: true, message: "Kategori disiplin berhasil dihapus" };
  },

  // --- Types ---
  getTypes: async ({ schoolId, query }: any) => {
    const data = await service.getTypes(schoolId, query);
    return { success: true, message: "Tipe aturan disiplin berhasil diambil", data };
  },

  createType: async ({ schoolId, body }: any) => {
    const data = await service.createType(schoolId, body);
    return { success: true, message: "Tipe aturan disiplin berhasil dibuat", data };
  },

  updateType: async ({ schoolId, params, body }: any) => {
    const data = await service.updateType(schoolId, Number(params.id), body);
    return { success: true, message: "Tipe aturan disiplin berhasil diperbarui", data };
  },

  deleteType: async ({ schoolId, params }: any) => {
    await service.deleteType(schoolId, Number(params.id));
    return { success: true, message: "Tipe aturan disiplin berhasil dihapus" };
  },

  // --- Incidents ---
  createIncident: async ({ schoolId, user, body }: any) => {
    const data = await service.createIncident(schoolId, user.id, body);
    return {
      success: true,
      message: "Laporan insiden disiplin berhasil dibuat",
      data
    };
  },

  getIncidents: async ({ schoolId, query }: any) => {
    // Merge default pagination (default limit 500 unless specified)
    const filters = {
      page: 1,
      limit: query?.limit ? parseInt(query.limit, 10) : 500,
      ...query
    };
    
    const result = await service.getIncidents(schoolId, filters);
    return {
      success: true,
      message: "Daftar insiden berhasil diambil",
      data: result.data,
      pagination: result.pagination
    };
  },

  updateIncidentStatus: async ({ schoolId, user, params, body }: any) => {
    // Assuming teacherId is available or we pass userId to be resolved inside service
    // For now we pass user.id as handlerTeacherId (In real app, we might need getTeacherIdFromUserId)
    // As per bible: "The service layer must map user.id to teacher.id", but here we just pass user.id and assume it's a teacher ID or admin ID.
    // To be safe, we'll pass user.id as the handler.
    const incidentId = Number(params.id);
    const data = await service.updateIncidentStatus(schoolId, incidentId, user.id, body);
    
    return {
      success: true,
      message: "Status insiden berhasil diperbarui",
      data
    };
  },

  // --- Sanctions ---
  getSanctionThresholds: async ({ schoolId }: any) => {
    const data = await service.getSanctionThresholds(schoolId);
    return {
      success: true,
      message: "Ambang batas sanksi berhasil diambil",
      data
    };
  },

  createThreshold: async ({ schoolId, body }: any) => {
    const data = await service.createThreshold(schoolId, body);
    return { success: true, message: "Ambang batas sanksi berhasil dibuat", data };
  },

  updateThreshold: async ({ schoolId, params, body }: any) => {
    const data = await service.updateThreshold(schoolId, Number(params.id), body);
    return { success: true, message: "Ambang batas sanksi berhasil diperbarui", data };
  },

  deleteThreshold: async ({ schoolId, params }: any) => {
    await service.deleteThreshold(schoolId, Number(params.id));
    return { success: true, message: "Ambang batas sanksi berhasil dihapus" };
  },

  getSanctionLogs: async ({ schoolId, query }: any) => {
    const data = await service.getSanctionLogs(schoolId, query);
    return {
      success: true,
      message: "Log sanksi siswa berhasil diambil",
      data
    };
  },

  updateSanctionStatus: async ({ schoolId, params, body }: any) => {
    const sanctionId = Number(params.id);
    const data = await service.updateSanctionLogStatus(schoolId, sanctionId, body);
    return {
      success: true,
      message: "Status sanksi siswa berhasil diperbarui",
      data
    };
  },

  getAnalytics: async ({ schoolId }: any) => {
    const data = await service.getAnalytics(schoolId);
    return {
      success: true,
      message: "Analitik kedisiplinan berhasil diambil",
      data
    };
  },

  getAtRiskStudents: async ({ schoolId }: any) => {
    const data = await service.getAtRiskStudents(schoolId);
    return {
      success: true,
      message: "Daftar siswa berisiko tinggi berhasil diambil",
      data
    };
  },

  // --- Pleno Kenaikan Kelas ---
  getPlenoDecisions: async ({ schoolId, query }: any) => {
    const filters = {
      classId: query?.classId ? Number(query.classId) : undefined,
      search: query?.search ? String(query.search) : undefined
    };
    const result = await service.getPlenoDecisions(schoolId, filters);
    return {
      success: true,
      message: "Data pertimbangan Rapat Pleno Kenaikan Kelas berhasil diambil",
      data: result.data,
      summary: result.summary
    };
  },

  overridePlenoDecision: async ({ schoolId, user, body }: any) => {
    const result = await service.overridePlenoDecision(schoolId, user.id, body);
    return {
      success: true,
      message: "Keputusan Rapat Pleno berhasil diperbarui secara fleksibel",
      data: result
    };
  },

  getStudentViolationDetails: async ({ schoolId, params }: any) => {
    const studentId = Number(params.studentId);
    const data = await service.getStudentViolationDetails(schoolId, studentId);
    return {
      success: true,
      message: "Detail pelanggaran siswa berhasil diambil",
      data
    };
  },

  getDemeritSummaryReport: async ({ schoolId }: any) => {
    const data = await service.getStudentDemeritSummaryReport(schoolId);
    return {
      success: true,
      message: "Ringkasan data poin demerit siswa berhasil diambil",
      data
    };
  }
};

