import { ClassesRepository } from "../repository/classesRepository";
import { TeachersRepository } from "../../teachers/repository/teachersRepository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/customErrors";
import { classes } from "../../../schema/classes";
import { academicYears } from "../../../schema/academicYears";
import { schedules } from "../../../schema/schedules";
import { db } from "../../../db";
import { eq, and, isNull } from "drizzle-orm";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class ClassesService {
  private repository = new ClassesRepository();
  private teachersRepository = new TeachersRepository();

  async getAllClasses(
    schoolId: number,
    user: UserContext,
    options: { page: number; limit: number; search?: string; status?: "Aktif" | "Nonaktif"; allowedClassIds?: number[] }
  ) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      
      const scheds = await db
        .select({ classId: schedules.classId })
        .from(schedules)
        .where(
          and(
            eq(schedules.teacherId, myTeacherId),
            isNull(schedules.deletedAt)
          )
        );
      const taughtClassIds = scheds.map(s => s.classId);
      
      const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
      const homeroomClassIds = homeroomClasses.map(c => c.id);
      
      options.allowedClassIds = Array.from(new Set([...taughtClassIds, ...homeroomClassIds]));
      if (options.allowedClassIds.length === 0) options.allowedClassIds = [-1]; // Prevent empty IN array error and return empty result
    }

    return await this.repository.findAll(schoolId, options);
  }

  async getClassById(schoolId: number, id: number) {
    const cls = await this.repository.findById(schoolId, id);
    if (!cls) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }
    return cls;
  }

  async createClass(schoolId: number, classData: Omit<typeof classes.$inferInsert, "schoolId" | "id">) {
    // 1. Validasi Tahun Ajaran ada
    const year = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, classData.academicYearId))
      .limit(1);
    if (year.length === 0) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }

    // 2. Validasi Wali Kelas (jika diisi) berasal dari sekolah yang sama
    if (classData.homeroomTeacherId) {
      const teacher = await this.teachersRepository.findById(schoolId, classData.homeroomTeacherId);
      if (!teacher) {
        throw new BadRequestError("Wali kelas harus terdaftar di sekolah yang sama");
      }
    }

    // 3. Validasi Nama Kelas unik per sekolah & tahun ajaran
    const existing = await this.repository.findByName(schoolId, classData.academicYearId, classData.name);
    if (existing) {
      throw new ConflictError("Nama kelas sudah terdaftar untuk tahun ajaran ini");
    }

    return await this.repository.create(schoolId, classData);
  }

  async updateClass(schoolId: number, id: number, classData: Partial<typeof classes.$inferInsert>) {
    // Pastikan kelas ada
    const cls = await this.repository.findById(schoolId, id);
    if (!cls) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }

    // 1. Validasi Tahun Ajaran ada jika diubah
    if (classData.academicYearId && classData.academicYearId !== cls.academicYearId) {
      const year = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.id, classData.academicYearId))
        .limit(1);
      if (year.length === 0) {
        throw new NotFoundError("Tahun ajaran tidak ditemukan");
      }
    }

    // 2. Validasi Wali Kelas jika diubah
    if (classData.homeroomTeacherId && classData.homeroomTeacherId !== cls.homeroomTeacherId) {
      const teacher = await this.teachersRepository.findById(schoolId, classData.homeroomTeacherId);
      if (!teacher) {
        throw new BadRequestError("Wali kelas harus terdaftar di sekolah yang sama");
      }
    }

    // 3. Validasi Nama Kelas jika nama atau tahun ajaran diubah
    const targetName = classData.name ?? cls.name;
    const targetYearId = classData.academicYearId ?? cls.academicYearId;

    if (classData.name || classData.academicYearId) {
      const existing = await this.repository.findByName(schoolId, targetYearId, targetName);
      if (existing && existing.id !== id) {
        throw new ConflictError("Nama kelas sudah terdaftar untuk tahun ajaran ini");
      }
    }

    return await this.repository.update(schoolId, id, classData);
  }

  async deleteClass(schoolId: number, id: number) {
    // Pastikan kelas ada
    const cls = await this.repository.findById(schoolId, id);
    if (!cls) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async deleteBulkClasses(schoolId: number, ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new ConflictError("Tidak ada kelas yang dipilih untuk dihapus");
    }
    await this.repository.softDeleteBulk(schoolId, ids);
  }
}
