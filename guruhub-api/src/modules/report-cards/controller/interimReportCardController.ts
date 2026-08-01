import { InterimReportCardService } from "../service/interimReportCardService";

const interimService = new InterimReportCardService();

export class InterimReportCardController {
  async generateOrGet(context: any) {
    try {
      const schoolId = context.schoolId;
      const body = context.body;

      const data = await interimService.generateOrGetInterimReportCard(schoolId, body);
      return {
        success: true,
        message: "Raport Sisipan berhasil diambil / dibuat",
        data,
      };
    } catch (error: any) {
      if (context.set) context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal memproses Raport Sisipan",
      };
    }
  }

  async getDetails(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);

      const data = await interimService.getInterimReportCardDetails(schoolId, id);
      return {
        success: true,
        message: "Detail Raport Sisipan berhasil diambil",
        data,
      };
    } catch (error: any) {
      if (context.set) context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil detail Raport Sisipan",
      };
    }
  }

  async getClassReports(context: any) {
    try {
      const schoolId = context.schoolId;
      const classId = Number(context.params.classId);
      const academicYearId = Number(context.query.academicYearId);
      const semester = context.query.semester as "GANJIL" | "GENAP";

      const data = await interimService.getClassInterimReportCards(schoolId, classId, academicYearId, semester);
      return {
        success: true,
        message: "Daftar Raport Sisipan kelas berhasil diambil",
        data,
      };
    } catch (error: any) {
      if (context.set) context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal mengambil Raport Sisipan kelas",
      };
    }
  }

  async batchSaveGrades(context: any) {
    try {
      const schoolId = context.schoolId;
      const body = context.body;

      const data = await interimService.batchSaveInterimGrades(schoolId, body);
      return {
        success: true,
        message: "Nilai Raport Sisipan berhasil diperbarui secara kolektif",
        data,
      };
    } catch (error: any) {
      if (context.set) context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menyajikan/menyimpan nilai Raport Sisipan",
      };
    }
  }

  async updateNotes(context: any) {
    try {
      const schoolId = context.schoolId;
      const id = Number(context.params.id);
      const body = context.body;

      const data = await interimService.updateInterimNotes(schoolId, id, body);
      return {
        success: true,
        message: "Catatan Wali Kelas / Kehadiran Raport Sisipan diperbarui",
        data,
      };
    } catch (error: any) {
      if (context.set) context.set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal memperbarui catatan Raport Sisipan",
      };
    }
  }
}
