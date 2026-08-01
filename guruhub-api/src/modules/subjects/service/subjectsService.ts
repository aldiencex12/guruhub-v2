import { SubjectsRepository } from "../repository/subjectsRepository";
import { NotFoundError, ConflictError } from "../../../errors/customErrors";
import { subjects } from "../../../schema/subjects";
import { schedules } from "../../../schema/schedules";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class SubjectsService {
  private repository = new SubjectsRepository();

  async getAllSubjects(schoolId: number, user: UserContext) {
    let allowedSubjectIds: number[] | undefined;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      const scheds = await db.select({ subjectId: schedules.subjectId }).from(schedules).where(eq(schedules.teacherId, myTeacherId));
      allowedSubjectIds = Array.from(new Set(scheds.map(s => s.subjectId)));
      if (allowedSubjectIds.length === 0) allowedSubjectIds = [-1]; // empty result
    }
    return await this.repository.findAll(schoolId, allowedSubjectIds);
  }

  async getSubjectById(schoolId: number, id: number) {
    const subject = await this.repository.findById(schoolId, id);
    if (!subject) {
      throw new NotFoundError("Mata pelajaran tidak ditemukan");
    }
    return subject;
  }

  async createSubject(schoolId: number, subjectData: Omit<typeof subjects.$inferInsert, "schoolId" | "id">) {
    // 1. Cek keunikan Kode Mapel di sekolah yang sama
    const existingCode = await this.repository.findByCode(schoolId, subjectData.code);
    if (existingCode) {
      throw new ConflictError("Kode mata pelajaran sudah terdaftar di sekolah ini");
    }

    // 2. Cek keunikan Nama Mapel di kelas yang sama
    if (!subjectData.gradeLevel) {
       throw new ConflictError("Grade level harus diisi");
    }
    const existingName = await this.repository.findByNameAndGrade(schoolId, subjectData.name, subjectData.gradeLevel);
    if (existingName) {
      throw new ConflictError(`Nama mata pelajaran sudah terdaftar di sekolah ini untuk Kelas ${subjectData.gradeLevel}`);
    }

    return await this.repository.create(schoolId, subjectData);
  }

  async updateSubject(schoolId: number, id: number, subjectData: Partial<typeof subjects.$inferInsert>) {
    // Pastikan mapel ada
    const subject = await this.repository.findById(schoolId, id);
    if (!subject) {
      throw new NotFoundError("Mata pelajaran tidak ditemukan");
    }

    // 1. Cek keunikan Kode Mapel jika diubah
    if (subjectData.code && subjectData.code !== subject.code) {
      const existingCode = await this.repository.findByCode(schoolId, subjectData.code);
      if (existingCode && existingCode.id !== id) {
        throw new ConflictError("Kode mata pelajaran sudah terdaftar di sekolah ini");
      }
    }

    // 2. Cek keunikan Nama Mapel di kelas yang sama jika diubah
    const newName = subjectData.name || subject.name;
    const newGrade = subjectData.gradeLevel || subject.gradeLevel;
    
    if (subjectData.name !== undefined || subjectData.gradeLevel !== undefined) {
      const existingName = await this.repository.findByNameAndGrade(schoolId, newName, newGrade);
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Nama mata pelajaran sudah terdaftar di sekolah ini untuk Kelas ${newGrade}`);
      }
    }

    return await this.repository.update(schoolId, id, subjectData);
  }

  async deleteSubject(schoolId: number, id: number) {
    // Pastikan mapel ada
    const subject = await this.repository.findById(schoolId, id);
    if (!subject) {
      throw new NotFoundError("Mata pelajaran tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async deleteBulkSubjects(schoolId: number, ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new ConflictError("Tidak ada mata pelajaran yang dipilih untuk dihapus");
    }
    await this.repository.softDeleteBulk(schoolId, ids);
  }
}
