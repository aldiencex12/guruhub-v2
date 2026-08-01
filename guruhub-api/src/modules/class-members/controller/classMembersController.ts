import { ClassMembersService } from "../service/classMembersService";

const classMembersService = new ClassMembersService();

export class ClassMembersController {
  async getAll({ schoolId, user, query }: any) {
    const classId = query.classId ? parseInt(query.classId, 10) : undefined;
    const academicYearId = query.academicYearId ? parseInt(query.academicYearId, 10) : undefined;
    const status = query.status || undefined;

    const data = await classMembersService.getAllClassMembers(schoolId, user, { classId, academicYearId, status });
    return {
      success: true,
      message: "Daftar anggota kelas berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await classMembersService.getClassMemberById(schoolId, id);
    return {
      success: true,
      message: "Detail membership berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await classMembersService.createClassMember(schoolId, body);
    return {
      success: true,
      message: "Siswa berhasil ditambahkan ke kelas",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await classMembersService.updateClassMember(schoolId, id, body);
    return {
      success: true,
      message: "Status membership berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    await classMembersService.deleteClassMember(schoolId, id);
    return {
      success: true,
      message: "Membership berhasil dihapus",
    };
  }

  async promote({ schoolId, body }: any) {
    console.log("PROMOTE API CALLED! body:", body, "schoolId:", schoolId);
    try {
      const data = await classMembersService.promoteStudents(schoolId, body);
      console.log("PROMOTE SUCCESS:", data);
      return {
        success: true,
        message: `Berhasil memindahkan ${data.count} siswa ke kelas baru`,
        data,
      };
    } catch(e) {
      console.error("PROMOTE ERROR:", e);
      throw e;
    }
  }
}
