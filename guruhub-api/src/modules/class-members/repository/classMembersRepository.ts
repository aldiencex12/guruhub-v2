import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { classMembers } from "../../../schema/classMembers";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";

export class ClassMembersRepository {
  async findAll(schoolId: number, filters: { classId?: number; academicYearId?: number; status?: string; allowedClassIds?: number[] }) {
    const conditions = [
      eq(classMembers.schoolId, schoolId),
      isNull(classMembers.deletedAt),
      isNull(students.deletedAt),
      isNull(classes.deletedAt),
    ];

    if (filters.classId !== undefined) {
      conditions.push(eq(classMembers.classId, filters.classId));
    }
    if (filters.academicYearId !== undefined) {
      conditions.push(eq(classMembers.academicYearId, filters.academicYearId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(classMembers.status, filters.status as any));
    }
    if (filters.allowedClassIds !== undefined) {
      conditions.push(inArray(classMembers.classId, filters.allowedClassIds));
    }

    const results = await db
      .select({
        id: classMembers.id,
        schoolId: classMembers.schoolId,
        classId: classMembers.classId,
        studentId: classMembers.studentId,
        academicYearId: classMembers.academicYearId,
        status: classMembers.status,
        createdAt: classMembers.createdAt,
        updatedAt: classMembers.updatedAt,
        deletedAt: classMembers.deletedAt,
        studentName: students.name,
        studentNisn: students.nisn,
        studentGender: students.gender,
        studentReligion: students.religion,
        className: classes.name,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(and(...conditions));

    return results.map(r => ({
      id: r.id,
      schoolId: r.schoolId,
      classId: r.classId,
      studentId: r.studentId,
      academicYearId: r.academicYearId,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      student: {
        id: r.studentId,
        name: r.studentName,
        nisn: r.studentNisn,
        gender: r.studentGender,
        religion: r.studentReligion,
      },
      class: {
        id: r.classId,
        name: r.className,
      }
    }));
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select({
        id: classMembers.id,
        schoolId: classMembers.schoolId,
        classId: classMembers.classId,
        studentId: classMembers.studentId,
        academicYearId: classMembers.academicYearId,
        status: classMembers.status,
        createdAt: classMembers.createdAt,
        updatedAt: classMembers.updatedAt,
        deletedAt: classMembers.deletedAt,
        studentName: students.name,
        studentNisn: students.nisn,
        studentGender: students.gender,
        studentReligion: students.religion,
        className: classes.name,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.id, id),
          isNull(classMembers.deletedAt),
          isNull(students.deletedAt),
          isNull(classes.deletedAt)
        )
      )
      .limit(1);

    if (result.length === 0) return null;
    const r = result[0];
    return {
      id: r.id,
      schoolId: r.schoolId,
      classId: r.classId,
      studentId: r.studentId,
      academicYearId: r.academicYearId,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      student: {
        id: r.studentId,
        name: r.studentName,
        nisn: r.studentNisn,
        gender: r.studentGender,
        religion: r.studentReligion,
      },
      class: {
        id: r.classId,
        name: r.className,
      }
    };
  }

  async findActiveMembershipInYear(schoolId: number, studentId: number, academicYearId: number) {
    const result = await db
      .select({
        id: classMembers.id,
        schoolId: classMembers.schoolId,
        classId: classMembers.classId,
        studentId: classMembers.studentId,
        academicYearId: classMembers.academicYearId,
        status: classMembers.status,
        createdAt: classMembers.createdAt,
        updatedAt: classMembers.updatedAt,
        deletedAt: classMembers.deletedAt,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.studentId, studentId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE"),
          isNull(classMembers.deletedAt),
          isNull(students.deletedAt),
          isNull(classes.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findDuplicateMembership(schoolId: number, studentId: number, classId: number, academicYearId: number) {
    const result = await db
      .select({
        id: classMembers.id,
        schoolId: classMembers.schoolId,
        classId: classMembers.classId,
        studentId: classMembers.studentId,
        academicYearId: classMembers.academicYearId,
        status: classMembers.status,
        createdAt: classMembers.createdAt,
        updatedAt: classMembers.updatedAt,
        deletedAt: classMembers.deletedAt,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.studentId, studentId),
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          isNull(classMembers.deletedAt),
          isNull(students.deletedAt),
          isNull(classes.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, data: Omit<typeof classMembers.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(classMembers).values({
      ...data,
      schoolId,
    });

    const newRecord = await db
      .select()
      .from(classMembers)
      .where(eq(classMembers.id, inserted.insertId))
      .limit(1);

    return newRecord[0];
  }

  async bulkCreate(schoolId: number, dataArray: Omit<typeof classMembers.$inferInsert, "schoolId">[]) {
    if (dataArray.length === 0) return [];
    
    const values = dataArray.map(data => ({
      ...data,
      schoolId,
    }));

    await db.insert(classMembers).values(values);
    return true;
  }

  async update(schoolId: number, id: number, data: Partial<typeof classMembers.$inferInsert>) {
    await db
      .update(classMembers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.id, id),
          isNull(classMembers.deletedAt)
        )
      );
    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(classMembers)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.id, id),
          isNull(classMembers.deletedAt)
        )
      );
  }
}
