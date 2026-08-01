import { DashboardService } from "../service/dashboardService";

const service = new DashboardService();

export class DashboardController {
  async getSummary(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getSchoolSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Sekolah summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil sekolah summary",
      };
    }
  }

  async getAttendance(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getAttendanceSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Absensi summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil absensi summary",
      };
    }
  }

  async getJournals(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getTeachingJournalSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Jurnal mengajar summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil jurnal mengajar summary",
      };
    }
  }

  async getAssessments(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getAssessmentSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Asesmen summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil asesmen summary",
      };
    }
  }

  async getGrades(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getGradeSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Nilai akhir summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil nilai akhir summary",
      };
    }
  }

  async getReportCards(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getReportCardSummary(schoolId, userId, role);
      return {
        success: true,
        message: "Rapor summary berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil rapor summary",
      };
    }
  }

  async getActivities(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getRecentActivities(schoolId, userId, role);
      return {
        success: true,
        message: "Aktivitas terbaru berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil aktivitas terbaru",
      };
    }
  }

  async getAcademicYears(context: any) {
    try {
      const schoolId = context.schoolId;
      const data = await service.getAcademicYears(schoolId);
      return {
        success: true,
        message: "Daftar tahun ajaran berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil daftar tahun ajaran",
      };
    }
  }
  async getPendingTasks(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getPendingTasks(schoolId, userId, role);
      return {
        success: true,
        message: "Tugas tertunda berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil tugas tertunda",
      };
    }
  }

  async getStudentHighlights(context: any) {
    try {
      const schoolId = context.schoolId;
      const userId = context.user.id;
      const role = context.user.role;

      const data = await service.getStudentHighlights(schoolId, userId, role);
      return {
        success: true,
        message: "Student highlights berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil student highlights",
      };
    }
  }
}
