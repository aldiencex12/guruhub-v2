import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { schedules } from "../../../schema/schedules";
import { attendances } from "../../../schema/attendances";
import { teachingJournals } from "../../../schema/teachingJournals";

export class SchedulesRepository {
  async findAll(schoolId: number, teacherId?: number, query?: { classId?: string }) {
    const conditions = [
      eq(schedules.schoolId, schoolId),
      isNull(schedules.deletedAt)
    ];

    if (teacherId) {
      conditions.push(eq(schedules.teacherId, teacherId));
    }
    
    if (query?.classId) {
      conditions.push(eq(schedules.classId, parseInt(query.classId, 10)));
    }

    return await db
      .select()
      .from(schedules)
      .where(and(...conditions));
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.schoolId, schoolId),
          eq(schedules.id, id),
          isNull(schedules.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findTeacherSchedulesByDay(schoolId: number, teacherId: number, dayOfWeek: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu") {
    return await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.schoolId, schoolId),
          eq(schedules.teacherId, teacherId),
          eq(schedules.dayOfWeek, dayOfWeek),
          isNull(schedules.deletedAt)
        )
      );
  }

  async findClassSchedulesByDay(schoolId: number, classId: number, dayOfWeek: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu") {
    return await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.schoolId, schoolId),
          eq(schedules.classId, classId),
          eq(schedules.dayOfWeek, dayOfWeek),
          isNull(schedules.deletedAt)
        )
      );
  }

  async create(schoolId: number, scheduleData: Omit<typeof schedules.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(schedules).values({
      ...scheduleData,
      schoolId,
    });

    const newRecord = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, inserted.insertId))
      .limit(1);

    return newRecord[0];
  }

  async update(schoolId: number, id: number, scheduleData: Partial<typeof schedules.$inferInsert>) {
    await db
      .update(schedules)
      .set({
        ...scheduleData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schedules.schoolId, schoolId),
          eq(schedules.id, id),
          isNull(schedules.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db.transaction(async (tx) => {
      await tx
        .update(schedules)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(schedules.schoolId, schoolId),
            eq(schedules.id, id),
            isNull(schedules.deletedAt)
          )
        );

      await tx
        .update(attendances)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(attendances.schoolId, schoolId),
            eq(attendances.scheduleId, id),
            isNull(attendances.deletedAt)
          )
        );

      await tx
        .update(teachingJournals)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(teachingJournals.schoolId, schoolId),
            eq(teachingJournals.scheduleId, id),
            isNull(teachingJournals.deletedAt)
          )
        );
    });
  }

  async bulkSoftDelete(schoolId: number, ids: number[]) {
    if (ids.length === 0) return;
    await db.transaction(async (tx) => {
      await tx
        .update(schedules)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(schedules.schoolId, schoolId),
            inArray(schedules.id, ids),
            isNull(schedules.deletedAt)
          )
        );

      await tx
        .update(attendances)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(attendances.schoolId, schoolId),
            inArray(attendances.scheduleId, ids),
            isNull(attendances.deletedAt)
          )
        );

      await tx
        .update(teachingJournals)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(teachingJournals.schoolId, schoolId),
            inArray(teachingJournals.scheduleId, ids),
            isNull(teachingJournals.deletedAt)
          )
        );
    });
  }

  async softDeleteAll(schoolId: number) {
    await db.transaction(async (tx) => {
      await tx
        .update(schedules)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(schedules.schoolId, schoolId),
            isNull(schedules.deletedAt)
          )
        );

      await tx
        .update(attendances)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(attendances.schoolId, schoolId),
            isNull(attendances.deletedAt)
          )
        );

      await tx
        .update(teachingJournals)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(teachingJournals.schoolId, schoolId),
            isNull(teachingJournals.deletedAt)
          )
        );
    });
  }
}
