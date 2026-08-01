import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../../db";
import { teachingJournals } from "../../../schema/teachingJournals";
import { schedules } from "../../../schema/schedules";
import { classes } from "../../../schema/classes";
import { subjects } from "../../../schema/subjects";

export class TeachingJournalsRepository {
  async findAll(
    schoolId: number,
    filters: { teacherId?: number; classId?: number; subjectId?: number; journalDate?: string }
  ) {
    const conditions = [
      eq(teachingJournals.schoolId, schoolId),
      isNull(teachingJournals.deletedAt),
      isNull(schedules.deletedAt),
    ];

    if (filters.teacherId !== undefined) {
      conditions.push(eq(teachingJournals.teacherId, filters.teacherId));
    }
    if (filters.journalDate !== undefined) {
      conditions.push(eq(teachingJournals.journalDate, filters.journalDate));
    }
    if (filters.classId !== undefined) {
      conditions.push(eq(schedules.classId, filters.classId));
    }
    if (filters.subjectId !== undefined) {
      conditions.push(eq(schedules.subjectId, filters.subjectId));
    }

    const results = await db
      .select({
        id: teachingJournals.id,
        schoolId: teachingJournals.schoolId,
        scheduleId: teachingJournals.scheduleId,
        teacherId: teachingJournals.teacherId,
        attendanceId: teachingJournals.attendanceId,
        journalDate: teachingJournals.journalDate,
        topic: teachingJournals.topic,
        learningObjectives: teachingJournals.learningObjectives,
        teachingMethod: teachingJournals.teachingMethod,
        reflection: teachingJournals.reflection,
        notes: teachingJournals.notes,
        createdAt: teachingJournals.createdAt,
        updatedAt: teachingJournals.updatedAt,
        deletedAt: teachingJournals.deletedAt,
        dayOfWeek: schedules.dayOfWeek,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(teachingJournals)
      .innerJoin(schedules, eq(teachingJournals.scheduleId, schedules.id))
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(and(...conditions));

    return results.map(r => ({
      id: r.id,
      schoolId: r.schoolId,
      scheduleId: r.scheduleId,
      teacherId: r.teacherId,
      attendanceId: r.attendanceId,
      journalDate: r.journalDate,
      topic: r.topic,
      learningObjectives: r.learningObjectives,
      teachingMethod: r.teachingMethod,
      reflection: r.reflection,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      schedule: {
        id: r.scheduleId,
        dayOfWeek: r.dayOfWeek,
        class: {
          name: r.className,
        },
        subject: {
          name: r.subjectName,
        }
      }
    }));
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select({
        id: teachingJournals.id,
        schoolId: teachingJournals.schoolId,
        scheduleId: teachingJournals.scheduleId,
        teacherId: teachingJournals.teacherId,
        attendanceId: teachingJournals.attendanceId,
        journalDate: teachingJournals.journalDate,
        topic: teachingJournals.topic,
        learningObjectives: teachingJournals.learningObjectives,
        teachingMethod: teachingJournals.teachingMethod,
        reflection: teachingJournals.reflection,
        notes: teachingJournals.notes,
        createdAt: teachingJournals.createdAt,
        updatedAt: teachingJournals.updatedAt,
        deletedAt: teachingJournals.deletedAt,
        dayOfWeek: schedules.dayOfWeek,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(teachingJournals)
      .innerJoin(schedules, eq(teachingJournals.scheduleId, schedules.id))
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(
        and(
          eq(teachingJournals.schoolId, schoolId),
          eq(teachingJournals.id, id),
          isNull(teachingJournals.deletedAt),
          isNull(schedules.deletedAt)
        )
      )
      .limit(1);

    if (result.length === 0) return null;
    const r = result[0];
    return {
      id: r.id,
      schoolId: r.schoolId,
      scheduleId: r.scheduleId,
      teacherId: r.teacherId,
      attendanceId: r.attendanceId,
      journalDate: r.journalDate,
      topic: r.topic,
      learningObjectives: r.learningObjectives,
      teachingMethod: r.teachingMethod,
      reflection: r.reflection,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      schedule: {
        id: r.scheduleId,
        dayOfWeek: r.dayOfWeek,
        class: {
          name: r.className,
        },
        subject: {
          name: r.subjectName,
        }
      }
    };
  }

  async findByScheduleAndDate(scheduleId: number, journalDate: string) {
    const result = await db
      .select()
      .from(teachingJournals)
      .where(
        and(
          eq(teachingJournals.scheduleId, scheduleId),
          eq(teachingJournals.journalDate, journalDate),
          isNull(teachingJournals.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, data: Omit<typeof teachingJournals.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(teachingJournals).values({
      ...data,
      schoolId,
    });

    return await this.findById(schoolId, inserted.insertId);
  }

  async update(schoolId: number, id: number, data: Partial<typeof teachingJournals.$inferInsert>) {
    await db
      .update(teachingJournals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachingJournals.schoolId, schoolId),
          eq(teachingJournals.id, id),
          isNull(teachingJournals.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(teachingJournals)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(teachingJournals.schoolId, schoolId),
          eq(teachingJournals.id, id),
          isNull(teachingJournals.deletedAt)
        )
      );
  }
}
