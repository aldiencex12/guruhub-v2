import { TeachersService } from "../service/teachersService";

const teachersService = new TeachersService();

export class TeachersController {
  async getAll({ schoolId, query, user }: any) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const search = query.search || undefined;
    const status = query.status || undefined;

    const result = await teachersService.getAllTeachers(schoolId, { page, limit, search, status }, user);
    return {
      success: true,
      message: "Daftar guru berhasil diambil",
      ...result,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await teachersService.getTeacherById(schoolId, id);
    return {
      success: true,
      message: "Detail guru berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await teachersService.createTeacher(schoolId, body);
    return {
      success: true,
      message: "Guru berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await teachersService.updateTeacher(schoolId, id, body);
    return {
      success: true,
      message: "Data guru berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await teachersService.deleteTeacher(schoolId, id);
    return {
      success: true,
      message: "Guru berhasil dihapus",
    };
  }
}
