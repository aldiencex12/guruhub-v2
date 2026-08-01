import { ReportCardService } from "../service/reportCardService";

const service = new ReportCardService();

export class ReportCardController {
  async getAll(context: any) {
    try {
      const schoolId = context.schoolId;
      const query = {
        classId: context.query.classId ? Number(context.query.classId) : undefined,
        academicYearId: context.query.academicYearId ? Number(context.query.academicYearId) : undefined,
        semester: context.query.semester as "GANJIL" | "GENAP" | undefined,
        status: context.query.status as "DRAFT" | "PUBLISHED" | undefined,
      };

      const user = context.user;
      const data = await service.getAllReportCards(schoolId, user, query);
      return {
        success: true,
        message: "Daftar rapor berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil daftar rapor",
      };
    }
  }

  async generate(context: any) {
    try {
      const schoolId = context.schoolId;
      const role = context.user.role;
      const body = context.body;

      const data = await service.generateReportCard(schoolId, body, role);
      return {
        success: true,
        message: "Rapor berhasil dibuat",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal membuat rapor",
      };
    }
  }

  async publish(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);

      const data = await service.publishReportCard(schoolId, id);
      return {
        success: true,
        message: "Rapor berhasil dipublikasikan",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal memublikasikan rapor",
      };
    }
  }

  async getDetails(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);

      const data = await service.getReportCardDetails(schoolId, id);
      return {
        success: true,
        message: "Detail rapor berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil detail rapor",
      };
    }
  }

  async getStudentReport(context: any) {
    try {
      const schoolId = context.schoolId;
      const studentId = Number(context.params.studentId);
      const query = {
        academicYearId: Number(context.query.academicYearId),
        semester: context.query.semester as "GANJIL" | "GENAP",
      };

      const data = await service.getStudentReportCard(schoolId, studentId, query);
      return {
        success: true,
        message: "Rapor siswa berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil rapor siswa",
      };
    }
  }

  async getClassReports(context: any) {
    try {
      const schoolId = context.schoolId;
      const classId = Number(context.params.classId);
      const query = {
        academicYearId: Number(context.query.academicYearId),
        semester: context.query.semester as "GANJIL" | "GENAP",
      };

      const data = await service.getClassReportCards(schoolId, classId, query);
      return {
        success: true,
        message: "Rapor kelas berhasil diambil",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil rapor kelas",
      };
    }
  }

  async updateNotes(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);
      const role = context.user.role;
      const body = context.body;

      const data = await service.updateHomeroomTeacherNotes(schoolId, id, body.notes, role);
      return {
        success: true,
        message: "Catatan wali kelas berhasil diperbarui",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal memperbarui catatan wali kelas",
      };
    }
  }

  async addAchievement(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);
      const role = context.user.role;
      const body = context.body;

      const data = await service.addAchievement(schoolId, id, body, role);
      return {
        success: true,
        message: "Prestasi berhasil ditambahkan ke rapor",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menambahkan prestasi",
      };
    }
  }

  async addExtracurricular(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);
      const role = context.user.role;
      const body = context.body;

      const data = await service.addExtracurricular(schoolId, id, body, role);
      return {
        success: true,
        message: "Ekstrakurikuler berhasil ditambahkan ke rapor",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menambahkan ekstrakurikuler",
      };
    }
  }

  async addP5(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);
      const role = context.user.role;
      const body = context.body;

      const data = await service.addP5Project(schoolId, id, body, role);
      return {
        success: true,
        message: "Projek P5 berhasil ditambahkan ke rapor",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menambahkan projek P5",
      };
    }
  }

  async delete(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);

      const data = await service.deleteReportCard(schoolId, id);
      return {
        success: true,
        message: "Rapor berhasil dihapus",
        data,
      };
    } catch (error: any) {
      context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menghapus rapor",
      };
    }
  }
}
