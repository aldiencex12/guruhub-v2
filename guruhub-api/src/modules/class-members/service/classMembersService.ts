import { ClassMembersRepository } from "../repository/classMembersRepository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/customErrors";
import { classMembers } from "../../../schema/classMembers";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { academicYears } from "../../../schema/academicYears";
import { schedules } from "../../../schema/schedules";
import { db } from "../../../db";
import { eq, and, isNull } from "drizzle-orm";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class ClassMembersService {
  private repository = new ClassMembersRepository();

  async getAllClassMembers(
    schoolId: number,
    user: UserContext,
    filters: { classId?: number; academicYearId?: number; status?: string; allowedClassIds?: number[] }
  ) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      
      const scheds = await db.select({ classId: schedules.classId }).from(schedules).where(eq(schedules.teacherId, myTeacherId));
      const taughtClassIds = scheds.map(s => s.classId);
      
      const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
      const homeroomClassIds = homeroomClasses.map(c => c.id);
      
      filters.allowedClassIds = Array.from(new Set([...taughtClassIds, ...homeroomClassIds]));
      if (filters.allowedClassIds.length === 0) filters.allowedClassIds = [-1];
    }
    
    return await this.repository.findAll(schoolId, filters);
  }

  async getClassMemberById(schoolId: number, id: number) {
    const member = await this.repository.findById(schoolId, id);
    if (!member) {
      throw new NotFoundError("Membership tidak ditemukan");
    }
    return member;
  }

  async createClassMember(
    schoolId: number,
    data: Omit<typeof classMembers.$inferInsert, "schoolId" | "id">
  ) {
    // 1. Validasi Student (harus aktif, eksis, dan satu tenant)
    const studentQuery = await db
      .select()
      .from(students)
      .where(eq(students.id, data.studentId))
      .limit(1);

    const student = studentQuery[0];
    if (!student || student.deletedAt) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }
    if (student.schoolId !== schoolId) {
      throw new BadRequestError("Siswa harus berasal dari sekolah yang sama");
    }

    // 2. Validasi Class (harus aktif, eksis, dan satu tenant)
    const classQuery = await db
      .select()
      .from(classes)
      .where(eq(classes.id, data.classId))
      .limit(1);

    const cls = classQuery[0];
    if (!cls || cls.deletedAt) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }
    if (cls.schoolId !== schoolId) {
      throw new BadRequestError("Kelas harus berasal dari sekolah yang sama");
    }

    // 3. Validasi AcademicYear (harus eksis dan satu tenant)
    const targetAcademicYearId = data.academicYearId || cls.academicYearId;
    if (!targetAcademicYearId) {
      throw new BadRequestError("Tahun ajaran tidak dapat diidentifikasi");
    }

    const yearQuery = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, targetAcademicYearId))
      .limit(1);

    const year = yearQuery[0];
    if (!year) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }
    if (year.schoolId !== schoolId) {
      throw new BadRequestError("Tahun ajaran harus berasal dari sekolah yang sama");
    }

    // 4. Validasi Duplikasi: tidak boleh memasukkan siswa yang sama ke kelas yang sama dua kali
    const duplicate = await this.repository.findDuplicateMembership(
      schoolId,
      data.studentId,
      data.classId,
      targetAcademicYearId
    );
    if (duplicate) {
      throw new ConflictError("Siswa sudah terdaftar di kelas ini");
    }

    // 5. Validasi Kelas Aktif: tidak boleh memiliki > 1 membership ACTIVE pada tahun ajaran yang sama
    const statusToCheck = data.status ?? "ACTIVE";
    if (statusToCheck === "ACTIVE") {
      const activeMember = await this.repository.findActiveMembershipInYear(
        schoolId,
        data.studentId,
        targetAcademicYearId
      );
      if (activeMember) {
        throw new ConflictError("Siswa sudah terdaftar di kelas aktif lain untuk tahun ajaran ini");
      }
    }

    return await this.repository.create(schoolId, {
      classId: data.classId,
      studentId: data.studentId,
      academicYearId: targetAcademicYearId,
      status: statusToCheck,
    });
  }

  async updateClassMember(
    schoolId: number,
    id: number,
    data: { status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" }
  ) {
    // 1. Pastikan membership ada
    const member = await this.repository.findById(schoolId, id);
    if (!member) {
      throw new NotFoundError("Membership tidak ditemukan");
    }

    // 2. Jika diupdate ke ACTIVE, pastikan tidak ada membership ACTIVE lain di tahun ajaran yang sama
    if (data.status === "ACTIVE" && member.status !== "ACTIVE") {
      const activeMember = await this.repository.findActiveMembershipInYear(
        schoolId,
        member.studentId,
        member.academicYearId
      );
      if (activeMember && activeMember.id !== id) {
        throw new ConflictError("Siswa sudah terdaftar di kelas aktif lain untuk tahun ajaran ini");
      }
    }

    return await this.repository.update(schoolId, id, data);
  }

  async deleteClassMember(schoolId: number, id: number) {
    const member = await this.repository.findById(schoolId, id);
    if (!member) {
      throw new NotFoundError("Membership tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async promoteStudents(schoolId: number, payload: { sourceClassId: number, targetClassId: number, studentIds: number[] }) {
    if (payload.studentIds.length === 0) return { count: 0 };
    
    // 1. Verify target class exists
    const targetClassQuery = await db.select().from(classes).where(eq(classes.id, payload.targetClassId)).limit(1);
    const targetClass = targetClassQuery[0];
    if (!targetClass || targetClass.deletedAt || targetClass.schoolId !== schoolId) {
      throw new NotFoundError("Kelas tujuan tidak ditemukan");
    }

    const targetAcademicYearId = targetClass.academicYearId;

    // 2. Fetch existing students in the target class to avoid duplicates
    const existingMembers = await db.select({ studentId: classMembers.studentId })
      .from(classMembers)
      .where(and(
        eq(classMembers.classId, payload.targetClassId),
        eq(classMembers.academicYearId, targetAcademicYearId),
        isNull(classMembers.deletedAt)
      ));
    const existingStudentIds = new Set(existingMembers.map(m => m.studentId));

    // 3. Prepare data for bulk insert
    const insertData: Omit<typeof classMembers.$inferInsert, "schoolId">[] = [];
    for (const studentId of payload.studentIds) {
      if (!existingStudentIds.has(studentId)) {
        insertData.push({
          classId: payload.targetClassId,
          studentId: studentId,
          academicYearId: targetAcademicYearId,
          status: "ACTIVE",
        });
      }
    }

    // 4. Perform bulk insert
    if (insertData.length > 0) {
      // Set any other active memberships for these students in the same academic year to INACTIVE
      for (const data of insertData) {
        await db.update(classMembers).set({ status: "INACTIVE" }).where(and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.studentId, data.studentId),
          eq(classMembers.academicYearId, targetAcademicYearId),
          eq(classMembers.status, "ACTIVE")
        ));
      }
      
      await this.repository.bulkCreate(schoolId, insertData);
    }

    return { count: insertData.length };
  }
}
