import { ClassesService } from "../service/classesService";

const classesService = new ClassesService();

export class ClassesController {
  async getAll({ schoolId, user, query }: any) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 500;
    const search = query.search || undefined;
    const status = query.status || undefined;
    const all = query.all === "true" || query.all === "1";

    const result = await classesService.getAllClasses(schoolId, user, { page, limit, search, status, all });
    return {
      success: true,
      message: "Daftar kelas berhasil diambil",
      ...result,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await classesService.getClassById(schoolId, id);
    return {
      success: true,
      message: "Detail kelas berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await classesService.createClass(schoolId, body);
    return {
      success: true,
      message: "Kelas berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await classesService.updateClass(schoolId, id, body);
    return {
      success: true,
      message: "Data kelas berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await classesService.deleteClass(schoolId, id);
    return {
      success: true,
      message: "Kelas berhasil dihapus",
    };
  }

  async deleteBulk({ schoolId, body }: any) {
    const { ids } = body;
    await classesService.deleteBulkClasses(schoolId, ids);
    return {
      success: true,
      message: `${ids.length} kelas berhasil dihapus`,
    };
  }
}
