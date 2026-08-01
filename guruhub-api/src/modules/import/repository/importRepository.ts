import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../../db";
import { schools } from "../../../schema/schools";
import { teachers } from "../../../schema/teachers";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { subjects } from "../../../schema/subjects";
import { classMembers } from "../../../schema/classMembers";
import { academicYears } from "../../../schema/academicYears";
import { auditLogs } from "../../../schema/auditLogs";

export class ImportRepository {
  /**
   * Get Active Academic Year for a school
   */
  async getActiveAcademicYear(schoolId: number) {
    const result = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Get all active teachers in school (to map NIP/IDs)
   */
  async getActiveTeachers(schoolId: number) {
    return db
      .select({ id: teachers.id, nip: teachers.nip })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)));
  }

  async getAllTeacherNipsForValidation(schoolId: number) {
    return db
      .select({ nip: teachers.nip })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)));
  }

  /**
   * Get all active students in school (to map NISN/IDs)
   */
  async getActiveStudents(schoolId: number) {
    return db
      .select({ id: students.id, nisn: students.nisn })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), isNull(students.deletedAt)));
  }

  /**
   * Get all active classes in school for a specific Academic Year
   */
  async getActiveClasses(schoolId: number, academicYearId: number) {
    return db
      .select({ id: classes.id, name: classes.name, academicYearId: classes.academicYearId })
      .from(classes)
      .where(and(eq(classes.schoolId, schoolId), eq(classes.academicYearId, academicYearId), isNull(classes.deletedAt)));
  }

  /**
   * Get all active subjects in school
   */
  async getActiveSubjects(schoolId: number) {
    return db
      .select({ id: subjects.id, code: subjects.code, name: subjects.name, gradeLevel: subjects.gradeLevel })
      .from(subjects)
      .where(and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt)));
  }

  /**
   * Get all active class members in school for an Academic Year
   */
  async getActiveClassMembers(schoolId: number, academicYearId: number) {
    return db
      .select({ studentId: classMembers.studentId, classId: classMembers.classId })
      .from(classMembers)
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE"),
          isNull(classMembers.deletedAt)
        )
      );
  }

  /**
   * Get all student NISNs globally (since NISN is globally unique)
   */
  async getAllStudentNisnsGlobal() {
    return db
      .select({ nisn: students.nisn })
      .from(students)
      .where(isNull(students.deletedAt));
  }


  /**
   * Insert audit log
   */
  async createAuditLog(log: typeof auditLogs.$inferInsert) {
    await db.insert(auditLogs).values(log);
  }

  /**
   * Run operations inside database transaction
   */
  async runTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return db.transaction(callback);
  }
}
