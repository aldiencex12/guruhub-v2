import { TeachersRepository } from "../repository/teachersRepository";
import { NotFoundError, ConflictError } from "../../../errors/customErrors";
import { teachers } from "../../../schema/teachers";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class TeachersService {
  private repository = new TeachersRepository();

  async getAllTeachers(
    schoolId: number,
    options: { page: number; limit: number; search?: string; status?: string },
    user: UserContext
  ) {
    let filterTeacherId: number | undefined;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      filterTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
    }
    return await this.repository.findAll(schoolId, options, filterTeacherId);
  }

  async getTeacherById(schoolId: number, id: number) {
    const teacher = await this.repository.findById(schoolId, id);
    if (!teacher) {
      throw new NotFoundError("Guru tidak ditemukan");
    }
    return teacher;
  }

  async createTeacher(schoolId: number, teacherData: Omit<typeof teachers.$inferInsert, "schoolId" | "id">) {
    // Cek duplikasi NIP jika NIP diisi
    if (teacherData.nip) {
      const existing = await this.repository.findByNip(schoolId, teacherData.nip);
      if (existing) {
        throw new ConflictError("NIP guru sudah terdaftar di sekolah ini");
      }
    }

    return await this.repository.create(schoolId, teacherData);
  }

  async updateTeacher(schoolId: number, id: number, teacherData: Partial<typeof teachers.$inferInsert>) {
    // Pastikan guru ada
    const teacher = await this.repository.findById(schoolId, id);
    if (!teacher) {
      throw new NotFoundError("Guru tidak ditemukan");
    }

    // Cek duplikasi NIP jika NIP diubah
    if (teacherData.nip && teacherData.nip !== teacher.nip) {
      const existing = await this.repository.findByNip(schoolId, teacherData.nip);
      if (existing && existing.id !== id) {
        throw new ConflictError("NIP guru sudah terdaftar di sekolah ini");
      }
    }

    return await this.repository.update(schoolId, id, teacherData);
  }

  async deleteTeacher(schoolId: number, id: number) {
    // Pastikan guru ada
    const teacher = await this.repository.findById(schoolId, id);
    if (!teacher) {
      throw new NotFoundError("Guru tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }
}
