import { SubjectsService } from "../service/subjectsService";

const subjectsService = new SubjectsService();

export class SubjectsController {
  async getAll({ schoolId, user }: any) {
    const data = await subjectsService.getAllSubjects(schoolId, user);
    return {
      success: true,
      message: "Daftar mata pelajaran berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await subjectsService.getSubjectById(schoolId, id);
    return {
      success: true,
      message: "Detail mata pelajaran berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await subjectsService.createSubject(schoolId, body);
    return {
      success: true,
      message: "Mata pelajaran berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await subjectsService.updateSubject(schoolId, id, body);
    return {
      success: true,
      message: "Data mata pelajaran berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await subjectsService.deleteSubject(schoolId, id);
    return {
      success: true,
      message: "Mata pelajaran berhasil dihapus",
    };
  }

  async deleteBulk({ schoolId, body }: any) {
    const { ids } = body;
    await subjectsService.deleteBulkSubjects(schoolId, ids);
    return {
      success: true,
      message: `${ids.length} mata pelajaran berhasil dihapus`,
    };
  }
}
