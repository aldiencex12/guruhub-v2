import { AcademicYearsService } from "../service/academicYearsService";

const service = new AcademicYearsService();

export class AcademicYearsController {
  async getAll({ schoolId }: any) {
    const data = await service.getAllAcademicYears(schoolId);
    return {
      success: true,
      message: "Daftar tahun ajaran berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await service.getAcademicYearById(schoolId, id);
    return {
      success: true,
      message: "Detail tahun ajaran berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await service.createAcademicYear(schoolId, body);
    return {
      success: true,
      message: "Tahun ajaran berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await service.updateAcademicYear(schoolId, id, body);
    return {
      success: true,
      message: "Tahun ajaran berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await service.deleteAcademicYear(schoolId, id);
    return {
      success: true,
      message: "Tahun ajaran berhasil dihapus",
    };
  }
}
