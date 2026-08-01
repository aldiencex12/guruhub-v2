import { StudentsService } from "../service/studentsService";

const studentsService = new StudentsService();

export class StudentsController {
  async getAll({ schoolId, query, user }: any) {
    const classId = query.classId ? parseInt(query.classId, 10) : undefined;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : (classId ? 500 : 10);
    const search = query.search || undefined;
    const status = query.status || undefined;

    const result = await studentsService.getAllStudents(schoolId, { page, limit, search, status, classId }, user);
    return {
      success: true,
      message: "Daftar siswa berhasil diambil",
      ...result,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await studentsService.getStudentById(schoolId, id);
    return {
      success: true,
      message: "Detail siswa berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await studentsService.createStudent(schoolId, body);
    return {
      success: true,
      message: "Siswa berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await studentsService.updateStudent(schoolId, id, body);
    return {
      success: true,
      message: "Data siswa berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await studentsService.deleteStudent(schoolId, id);
    return {
      success: true,
      message: "Siswa berhasil dihapus",
    };
  }

  async deleteBulk({ schoolId, body }: any) {
    const ids = body.ids || [];
    await studentsService.deleteBulkStudents(schoolId, ids);
    return {
      success: true,
      message: "Siswa-siswa berhasil dihapus secara masal",
    };
  }
}
