import { StudentsRepository } from "../repository/studentsRepository";
import { NotFoundError, ConflictError } from "../../../errors/customErrors";
import { students } from "../../../schema/students";
import { classMembers } from "../../../schema/classMembers";
import { classes } from "../../../schema/classes";
import { schedules } from "../../../schema/schedules";
import { db } from "../../../db";
import { eq, inArray, and, isNull } from "drizzle-orm";
import { type UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class StudentsService {
  private repository = new StudentsRepository();

  async getAllStudents(
    schoolId: number,
    options: { page: number; limit: number; search?: string; status?: "Aktif" | "Nonaktif"; classId?: number },
    user: UserContext
  ) {
    let allowedStudentIds: number[] | undefined;

    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);

      // Get classes taught by teacher
      const scheds = await db.select({ classId: schedules.classId }).from(schedules).where(eq(schedules.teacherId, myTeacherId));
      const taughtClassIds = scheds.map(s => s.classId);

      // Get homeroom classes
      const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
      const homeroomClassIds = homeroomClasses.map(c => c.id);

      const allowedClassIds = Array.from(new Set([...taughtClassIds, ...homeroomClassIds]));
      
      if (allowedClassIds.length > 0) {
        const members = await db.select({ studentId: classMembers.studentId })
          .from(classMembers)
          .where(and(inArray(classMembers.classId, allowedClassIds), isNull(classMembers.deletedAt)));
        allowedStudentIds = Array.from(new Set(members.map(m => m.studentId)));
      }
      
      if (!allowedStudentIds || allowedStudentIds.length === 0) {
        allowedStudentIds = [-1]; // Prevent empty IN error
      }
    }

    if (options.classId) {
      const members = await db.select({ studentId: classMembers.studentId })
        .from(classMembers)
        .where(and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.classId, options.classId),
          isNull(classMembers.deletedAt)
        ));
      const classStudentIds = members.map(m => m.studentId);
      if (classStudentIds.length === 0) {
        allowedStudentIds = [-1];
      } else if (allowedStudentIds) {
        allowedStudentIds = allowedStudentIds.filter(id => classStudentIds.includes(id));
        if (allowedStudentIds.length === 0) allowedStudentIds = [-1];
      } else {
        allowedStudentIds = classStudentIds;
      }
    }

    return await this.repository.findAll(schoolId, options, allowedStudentIds);
  }

  async getStudentById(schoolId: number, id: number) {
    const student = await this.repository.findById(schoolId, id);
    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }
    return student;
  }

  async createStudent(schoolId: number, studentData: Omit<typeof students.$inferInsert, "schoolId" | "id">) {
    // Cek duplikasi NISN secara nasional
    if (studentData.nisn) {
      const existingNisn = await this.repository.findByNisn(studentData.nisn);
      if (existingNisn) {
        throw new ConflictError("NISN siswa sudah terdaftar secara nasional");
      }
    }

    return await this.repository.create(schoolId, studentData);
  }

  async updateStudent(schoolId: number, id: number, studentData: Partial<typeof students.$inferInsert>) {
    // Pastikan siswa ada
    const student = await this.repository.findById(schoolId, id);
    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }

    // Cek duplikasi NISN jika NISN diubah
    if (studentData.nisn && studentData.nisn !== student.nisn) {
      const existingNisn = await this.repository.findByNisn(studentData.nisn);
      if (existingNisn && existingNisn.id !== id) {
        throw new ConflictError("NISN siswa sudah terdaftar secara nasional");
      }
    }

    return await this.repository.update(schoolId, id, studentData);
  }

  async deleteStudent(schoolId: number, id: number) {
    const student = await this.repository.findById(schoolId, id);
    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async deleteBulkStudents(schoolId: number, ids: number[]) {
    if (ids.length === 0) return;
    await this.repository.softDeleteBulk(schoolId, ids);
  }
}
