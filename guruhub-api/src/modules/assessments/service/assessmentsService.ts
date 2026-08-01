import { AssessmentsRepository } from "../repository/assessmentsRepository";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "../../../errors/customErrors";
import { assessments, assessmentScores } from "../../../schema/assessments";
import { teachers } from "../../../schema/teachers";
import { classes } from "../../../schema/classes";
import { subjects } from "../../../schema/subjects";
import { academicYears } from "../../../schema/academicYears";
import { classMembers } from "../../../schema/classMembers";
import { students } from "../../../schema/students";
import { assessmentCategories } from "../../../schema/assessmentCategories";
import { db } from "../../../db";
import { eq, and, isNull } from "drizzle-orm";

import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class AssessmentsService {
  private repository = new AssessmentsRepository();



  async getAllAssessments(
    schoolId: number,
    user: UserContext,
    filters: { classId?: number; subjectId?: number; teacherId?: number; assessmentType?: string; academicYearId?: number; allowedHomeroomClassIds?: number[] }
  ) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      filters.teacherId = myTeacherId; // This acts as the "is my assessment" filter
      
      if (user.role === "HomeroomTeacher") {
        const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
        filters.allowedHomeroomClassIds = homeroomClasses.map(c => c.id);
      }
    }
    return await this.repository.findAll(schoolId, filters);
  }

  async getAssessmentById(schoolId: number, user: UserContext, id: number) {
    const data = await this.repository.findDetailWithScores(schoolId, id);
    if (!data) {
      throw new NotFoundError("Asesmen tidak ditemukan");
    }

    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      
      let isHomeroomOfThisClass = false;
      if (user.role === "HomeroomTeacher") {
        const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
        isHomeroomOfThisClass = homeroomClasses.some(c => c.id === data.classId);
      }

      if (data.teacherId !== myTeacherId && !isHomeroomOfThisClass) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk asesmen ini");
      }
    }

    return data;
  }

  async createAssessment(
    schoolId: number,
    user: UserContext,
    data: Omit<typeof assessments.$inferInsert, "schoolId" | "id">
  ) {
    if (data.maxScore <= 0) {
      throw new BadRequestError("Max score harus lebih besar dari 0");
    }

    // Hak akses guru
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (data.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda hanya diperbolehkan mengelola asesmen Anda sendiri");
      }
    }

    // Validasi kelas eksis dan satu tenant
    const classQuery = await db.select().from(classes).where(eq(classes.id, data.classId)).limit(1);
    const cls = classQuery[0];
    if (!cls || cls.deletedAt) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }
    if (cls.schoolId !== schoolId) {
      throw new BadRequestError("Kelas harus berasal dari sekolah yang sama");
    }

    // Validasi mapel eksis dan satu tenant
    const subjectQuery = await db.select().from(subjects).where(eq(subjects.id, data.subjectId)).limit(1);
    const sub = subjectQuery[0];
    if (!sub || sub.deletedAt) {
      throw new NotFoundError("Mata pelajaran tidak ditemukan");
    }
    if (sub.schoolId !== schoolId) {
      throw new BadRequestError("Mata pelajaran harus berasal dari sekolah yang sama");
    }

    // Validasi guru eksis dan satu tenant
    const teacherQuery = await db.select().from(teachers).where(eq(teachers.id, data.teacherId)).limit(1);
    const tch = teacherQuery[0];
    if (!tch || tch.deletedAt) {
      throw new NotFoundError("Guru tidak ditemukan");
    }
    if (tch.schoolId !== schoolId) {
      throw new BadRequestError("Guru harus berasal dari sekolah yang sama");
    }

    // Validasi tahun ajaran eksis dan satu tenant
    const ayQuery = await db.select().from(academicYears).where(eq(academicYears.id, data.academicYearId)).limit(1);
    const ay = ayQuery[0];
    if (!ay) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }
    if (ay.schoolId !== schoolId) {
      throw new BadRequestError("Tahun ajaran harus berasal dari sekolah yang sama");
    }

    // Validasi kategori penilaian eksis dan satu tenant
    if (data.categoryId) {
      const catQuery = await db.select().from(assessmentCategories).where(eq(assessmentCategories.id, data.categoryId)).limit(1);
      const cat = catQuery[0];
      if (!cat || cat.deletedAt) {
        throw new NotFoundError("Kategori penilaian tidak ditemukan");
      }
      if (cat.schoolId !== schoolId) {
        throw new BadRequestError("Kategori penilaian harus berasal dari sekolah yang sama");
      }
      
      if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
        const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
        if (cat.teacherId !== null && cat.teacherId !== myTeacherId) {
          throw new ForbiddenError("Anda tidak dapat menggunakan kategori penilaian milik guru lain");
        }
      }
    }

    return await this.repository.create(schoolId, data);
  }

  async updateAssessment(
    schoolId: number,
    user: UserContext,
    id: number,
    data: Partial<typeof assessments.$inferInsert>
  ) {
    const assessment = await this.repository.findById(schoolId, id);
    if (!assessment) {
      throw new NotFoundError("Asesmen tidak ditemukan");
    }

    // Hak akses guru
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (assessment.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk memperbarui asesmen ini");
      }
    }

    const updatedMaxScore = data.maxScore ?? assessment.maxScore;
    if (updatedMaxScore <= 0) {
      throw new BadRequestError("Max score harus lebih besar dari 0");
    }

    // Jika mengubah maxScore, pastikan tidak ada nilai tersimpan yang melampaui maxScore baru
    if (data.maxScore !== undefined) {
      const existingScores = await db
        .select()
        .from(assessmentScores)
        .where(eq(assessmentScores.assessmentId, id));
      const exceeds = existingScores.some((s) => s.score > (data.maxScore as number));
      if (exceeds) {
        throw new BadRequestError("Max score baru tidak boleh lebih kecil dari nilai siswa yang sudah ada");
      }
    }

    // Validasi kelas jika diubah
    if (data.classId !== undefined && data.classId !== assessment.classId) {
      const classQuery = await db.select().from(classes).where(eq(classes.id, data.classId)).limit(1);
      const cls = classQuery[0];
      if (!cls || cls.deletedAt) {
        throw new NotFoundError("Kelas tidak ditemukan");
      }
      if (cls.schoolId !== schoolId) {
        throw new BadRequestError("Kelas harus berasal dari sekolah yang sama");
      }
    }

    // Validasi mapel jika diubah
    if (data.subjectId !== undefined && data.subjectId !== assessment.subjectId) {
      const subjectQuery = await db.select().from(subjects).where(eq(subjects.id, data.subjectId)).limit(1);
      const sub = subjectQuery[0];
      if (!sub || sub.deletedAt) {
        throw new NotFoundError("Mata pelajaran tidak ditemukan");
      }
      if (sub.schoolId !== schoolId) {
        throw new BadRequestError("Mata pelajaran harus berasal dari sekolah yang sama");
      }
    }

    // Validasi guru jika diubah
    if (data.teacherId !== undefined && data.teacherId !== assessment.teacherId) {
      if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
        throw new ForbiddenError("Anda tidak diperbolehkan mengubah kepemilikan asesmen");
      }
      const teacherQuery = await db.select().from(teachers).where(eq(teachers.id, data.teacherId)).limit(1);
      const tch = teacherQuery[0];
      if (!tch || tch.deletedAt) {
        throw new NotFoundError("Guru tidak ditemukan");
      }
      if (tch.schoolId !== schoolId) {
        throw new BadRequestError("Guru harus berasal dari sekolah yang sama");
      }
    }

    // Validasi tahun ajaran jika diubah
    if (data.academicYearId !== undefined && data.academicYearId !== assessment.academicYearId) {
      const ayQuery = await db.select().from(academicYears).where(eq(academicYears.id, data.academicYearId)).limit(1);
      const ay = ayQuery[0];
      if (!ay) {
        throw new NotFoundError("Tahun ajaran tidak ditemukan");
      }
      if (ay.schoolId !== schoolId) {
        throw new BadRequestError("Tahun ajaran harus berasal dari sekolah yang sama");
      }
    }

    // Validasi kategori penilaian jika diubah
    if (data.categoryId !== undefined && data.categoryId !== assessment.categoryId) {
      if (data.categoryId) {
        const catQuery = await db.select().from(assessmentCategories).where(eq(assessmentCategories.id, data.categoryId)).limit(1);
        const cat = catQuery[0];
        if (!cat || cat.deletedAt) {
          throw new NotFoundError("Kategori penilaian tidak ditemukan");
        }
        if (cat.schoolId !== schoolId) {
          throw new BadRequestError("Kategori penilaian harus berasal dari sekolah yang sama");
        }

        if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
          const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
          if (cat.teacherId !== null && cat.teacherId !== myTeacherId) {
            throw new ForbiddenError("Anda tidak dapat menggunakan kategori penilaian milik guru lain");
          }
        }
      }
    }

    return await this.repository.update(schoolId, id, data);
  }

  async deleteAssessment(schoolId: number, user: UserContext, id: number) {
    const assessment = await this.repository.findById(schoolId, id);
    if (!assessment) {
      throw new NotFoundError("Asesmen tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async inputScores(
    schoolId: number,
    user: UserContext,
    assessmentId: number,
    scoresList: { studentId: number; score: number; notes?: string | null }[]
  ) {
    const assessment = await this.repository.findById(schoolId, assessmentId);
    if (!assessment) {
      throw new NotFoundError("Asesmen tidak ditemukan");
    }

    // Hak akses guru
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (assessment.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk memasukkan nilai pada asesmen ini");
      }
    }

    // Validasi nilai dan keanggotaan kelas setiap siswa
    for (const item of scoresList) {
      if (item.score < 0) {
        throw new BadRequestError("Nilai tidak boleh kurang dari 0");
      }
      if (item.score > assessment.maxScore) {
        throw new BadRequestError(`Nilai siswa dengan ID ${item.studentId} melebihi batas nilai maksimal asesmen (${assessment.maxScore})`);
      }

      // Validasi siswa eksis
      const studentQuery = await db.select().from(students).where(eq(students.id, item.studentId)).limit(1);
      const stud = studentQuery[0];
      if (!stud || stud.deletedAt) {
        throw new NotFoundError(`Siswa dengan ID ${item.studentId} tidak ditemukan`);
      }
      if (stud.schoolId !== schoolId) {
        throw new BadRequestError(`Siswa dengan ID ${item.studentId} berasal dari sekolah lain`);
      }

      // Validasi keanggotaan kelas aktif (ACTIVE)
      const membershipQuery = await db
        .select()
        .from(classMembers)
        .where(
          and(
            eq(classMembers.studentId, item.studentId),
            eq(classMembers.classId, assessment.classId)
          )
        )
        .limit(1);

      const membership = membershipQuery[0];
      if (!membership || membership.deletedAt) {
        throw new BadRequestError(`Siswa dengan ID ${item.studentId} tidak terdaftar di kelas asesmen ini`);
      }
      if (membership.status !== "ACTIVE") {
        throw new BadRequestError(`Keanggotaan kelas siswa dengan ID ${item.studentId} tidak berstatus ACTIVE`);
      }
    }

    return await this.repository.upsertScores(assessmentId, scoresList);
  }
}
