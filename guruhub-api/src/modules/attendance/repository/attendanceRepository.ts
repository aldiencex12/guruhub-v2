import { eq, and, isNull, sql, or, inArray, like } from "drizzle-orm";
import { db } from "../../../db";
import { attendances, attendanceDetails } from "../../../schema/attendances";
import { classes } from "../../../schema/classes";
import { classMembers } from "../../../schema/classMembers";
import { students } from "../../../schema/students";
import { schedules } from "../../../schema/schedules";
import { teachers } from "../../../schema/teachers";
import { subjects } from "../../../schema/subjects";

export class AttendanceRepository {
  async findTeacherByUserId(schoolId: number, userId: number) {
    const result = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), eq(teachers.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async findScheduleById(schoolId: number, scheduleId: number) {
    const result = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.schoolId, schoolId), eq(schedules.id, scheduleId), isNull(schedules.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async findClassStudents(schoolId: number, classId: number) {
    return await db
      .select({
        id: students.id,
        name: students.name,
        nisn: students.nisn,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(
        and(
          eq(classMembers.schoolId, schoolId),
          eq(classMembers.classId, classId),
          eq(classMembers.status, "ACTIVE"),
          isNull(classMembers.deletedAt),
          isNull(students.deletedAt),
          isNull(classes.deletedAt)
        )
      );
  }

  async findAttendanceByScheduleAndDate(schoolId: number, scheduleId: number, dateStr: string) {
    const result = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.schoolId, schoolId),
          eq(attendances.scheduleId, scheduleId),
          eq(attendances.attendanceDate, dateStr),
          isNull(attendances.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async createAttendance(
    schoolId: number,
    teacherId: number,
    scheduleId: number,
    attendanceDate: string,
    notes: string | undefined,
    details: { studentId: number; status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"; notes?: string }[]
  ) {
    return await db.transaction(async (tx) => {
      try {
        // 1. Insert attendance header
        const [inserted] = await tx.insert(attendances).values({
          schoolId,
          teacherId,
          scheduleId,
          attendanceDate,
          notes,
        });

        const attendanceId = inserted.insertId;

        // 2. Insert details
        if (details.length > 0) {
          const detailValues = details.map((d) => ({
            attendanceId,
            studentId: d.studentId,
            status: d.status,
            notes: d.notes || null,
          }));
          await tx.insert(attendanceDetails).values(detailValues);
        }

        // 3. Return the new attendance header
        const result = await tx
          .select()
          .from(attendances)
          .where(and(eq(attendances.id, attendanceId), eq(attendances.schoolId, schoolId)))
          .limit(1);
        
        const record = result[0];
        if (!record) {
          throw new Error("Gagal mengambil data absensi yang baru dibuat");
        }
        return record;
      } catch (err: any) {
        console.error("[CRITICAL ERROR IN attendanceRepository]:", err);
        throw err;
      }
    });
  }

  async findAttendanceById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.id, id), eq(attendances.schoolId, schoolId), isNull(attendances.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async findAttendanceDetails(attendanceId: number) {
    return await db
      .select({
        id: attendanceDetails.id,
        attendanceId: attendanceDetails.attendanceId,
        studentId: attendanceDetails.studentId,
        studentName: students.name,
        status: attendanceDetails.status,
        notes: attendanceDetails.notes,
        createdAt: attendanceDetails.createdAt,
        updatedAt: attendanceDetails.updatedAt,
      })
      .from(attendanceDetails)
      .innerJoin(students, eq(attendanceDetails.studentId, students.id))
      .where(eq(attendanceDetails.attendanceId, attendanceId));
  }

  async updateAttendance(
    schoolId: number,
    id: number,
    notes: string | undefined,
    details?: { studentId: number; status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"; notes?: string }[]
  ) {
    return await db.transaction(async (tx) => {
      // 1. Update header if notes is defined
      if (notes !== undefined) {
        await tx
          .update(attendances)
          .set({ notes, updatedAt: new Date() })
          .where(and(eq(attendances.id, id), eq(attendances.schoolId, schoolId)));
      }

      // 2. Update details
      if (details && details.length > 0) {
        for (const d of details) {
          // Update status & notes for this student in this attendance
          await tx
            .update(attendanceDetails)
            .set({ status: d.status, notes: d.notes || null, updatedAt: new Date() })
            .where(
              and(
                eq(attendanceDetails.attendanceId, id),
                eq(attendanceDetails.studentId, d.studentId)
              )
            );
        }
      }

      // 3. Get updated header
      const result = await tx
        .select()
        .from(attendances)
        .where(and(eq(attendances.id, id), eq(attendances.schoolId, schoolId)))
        .limit(1);
      
      const record = result[0];
      if (!record) {
        throw new Error("Gagal mengambil data absensi yang diupdate");
      }
      return record;
    });
  }

  async hardDeleteAttendance(schoolId: number, id: number) {
    // Hard delete agar unique index (school_id, schedule_id, attendance_date)
    // dibebaskan sepenuhnya dan absensi bisa dibuat ulang di tanggal yang sama
    await db
      .delete(attendanceDetails)
      .where(eq(attendanceDetails.attendanceId, id));
    await db
      .delete(attendances)
      .where(and(eq(attendances.id, id), eq(attendances.schoolId, schoolId)));
  }

  async findAllAttendances(
    schoolId: number,
    filters: { classId?: number; teacherId?: number; date?: string; allowedHomeroomClassIds?: number[] }
  ) {
    const conditions = [
      eq(attendances.schoolId, schoolId),
      isNull(attendances.deletedAt),
      isNull(schedules.deletedAt),
    ];

    if (filters.date) {
      conditions.push(eq(attendances.attendanceDate, filters.date));
    }

    if (filters.classId) {
      conditions.push(eq(schedules.classId, filters.classId));
    }

    if (filters.teacherId) {
      if (filters.allowedHomeroomClassIds && filters.allowedHomeroomClassIds.length > 0) {
        const cond = or(
          eq(attendances.teacherId, filters.teacherId),
          inArray(schedules.classId, filters.allowedHomeroomClassIds)
        );
        if (cond) conditions.push(cond);
      } else {
        conditions.push(eq(attendances.teacherId, filters.teacherId));
      }
    } else if (filters.allowedHomeroomClassIds && filters.allowedHomeroomClassIds.length > 0) {
      conditions.push(inArray(schedules.classId, filters.allowedHomeroomClassIds));
    }

    return await db
      .select({
        id: attendances.id,
        schoolId: attendances.schoolId,
        scheduleId: attendances.scheduleId,
        teacherId: attendances.teacherId,
        attendanceDate: attendances.attendanceDate,
        notes: attendances.notes,
        createdAt: attendances.createdAt,
        updatedAt: attendances.updatedAt,
      })
      .from(attendances)
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .where(and(...conditions));
  }

  async getMonthlyRecapData(schoolId: number, classId: number, month: string) {
    // 1. Get class details
    const classRecord = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId), isNull(classes.deletedAt)))
      .limit(1);

    if (classRecord.length === 0) return null;

    // 2. Get all active students in the class
    const members = await db
      .select({
        studentId: classMembers.studentId,
        studentName: students.name,
        nisn: students.nisn,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .where(and(eq(classMembers.classId, classId), isNull(students.deletedAt)));

    // 3. Get all attendances in that month for the class
    const attendancesInMonth = await db
      .select({
        id: attendances.id,
        attendanceDate: attendances.attendanceDate,
        scheduleId: attendances.scheduleId,
        subjectName: subjects.name,
      })
      .from(attendances)
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(
        and(
          eq(attendances.schoolId, schoolId),
          eq(schedules.classId, classId),
          like(attendances.attendanceDate, `${month}-%`),
          isNull(attendances.deletedAt),
          isNull(schedules.deletedAt),
          isNull(subjects.deletedAt)
        )
      );

    // 4. Get all details for these attendances
    const attendanceIds = attendancesInMonth.map(a => a.id);
    let details: any[] = [];
    if (attendanceIds.length > 0) {
      details = await db
        .select({
          id: attendanceDetails.id,
          attendanceId: attendanceDetails.attendanceId,
          studentId: attendanceDetails.studentId,
          status: attendanceDetails.status,
          notes: attendanceDetails.notes,
        })
        .from(attendanceDetails)
        .where(inArray(attendanceDetails.attendanceId, attendanceIds));
    }

    return {
      class: classRecord[0],
      students: members,
      attendances: attendancesInMonth,
      details,
    };
  }

  async getSemesterRecapData(schoolId: number, classId: number, year: number, semester: 1 | 2) {
    const classRecord = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId), isNull(classes.deletedAt)))
      .limit(1);

    if (classRecord.length === 0) return null;

    const members = await db
      .select({
        studentId: classMembers.studentId,
        studentName: students.name,
        nisn: students.nisn,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .where(and(eq(classMembers.classId, classId), isNull(students.deletedAt)));

    const targetYear = semester === 1 ? year : year + 1;
    const startDate = semester === 1 ? `${targetYear}-07-01` : `${targetYear}-01-01`;
    const endDate = semester === 1 ? `${targetYear}-12-31` : `${targetYear}-06-30`;

    const attendancesInSemester = await db
      .select({
        id: attendances.id,
        attendanceDate: attendances.attendanceDate,
        scheduleId: attendances.scheduleId,
        subjectName: subjects.name,
      })
      .from(attendances)
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(
        and(
          eq(attendances.schoolId, schoolId),
          eq(schedules.classId, classId),
          sql`${attendances.attendanceDate} >= ${startDate}`,
          sql`${attendances.attendanceDate} <= ${endDate}`,
          isNull(attendances.deletedAt),
          isNull(schedules.deletedAt),
          isNull(subjects.deletedAt)
        )
      );

    const attendanceIds = attendancesInSemester.map(a => a.id);
    let details: any[] = [];
    if (attendanceIds.length > 0) {
      details = await db
        .select({
          id: attendanceDetails.id,
          attendanceId: attendanceDetails.attendanceId,
          studentId: attendanceDetails.studentId,
          status: attendanceDetails.status,
          notes: attendanceDetails.notes,
        })
        .from(attendanceDetails)
        .where(inArray(attendanceDetails.attendanceId, attendanceIds));
    }

    return {
      class: classRecord[0],
      students: members,
      attendances: attendancesInSemester,
      details,
      semester,
      year,
    };
  }
}
