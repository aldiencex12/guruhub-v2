import { eq, and, isNull, or, like, sql } from "drizzle-orm";
import { db } from "../../../db";
import { teachers } from "../../../schema/teachers";

export class TeachersRepository {
  async findAll(
    schoolId: number,
    options: { page: number; limit: number; search?: string; status?: string },
    filterTeacherId?: number
  ) {
    const offset = (options.page - 1) * options.limit;

    const conditions: any[] = [
      eq(teachers.schoolId, schoolId),
      isNull(teachers.deletedAt)
    ];

    if (filterTeacherId) {
      conditions.push(eq(teachers.id, filterTeacherId));
    }

    if (options.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          like(teachers.name, searchPattern),
          like(teachers.nip, searchPattern)
        )
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(teachers)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count || 0);
    const totalPages = Math.ceil(totalItems / options.limit);

    const data = await db
      .select()
      .from(teachers)
      .where(and(...conditions))
      .limit(options.limit)
      .offset(offset);

    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: options.page,
        limit: options.limit
      }
    };
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.schoolId, schoolId),
          eq(teachers.id, id),
          isNull(teachers.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByNip(schoolId: number, nip: string) {
    const result = await db
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.schoolId, schoolId),
          eq(teachers.nip, nip),
          isNull(teachers.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, teacherData: Omit<typeof teachers.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(teachers).values({
      ...teacherData,
      schoolId,
    });
    
    // Kembalikan record yang baru dibuat
    const newRecord = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, inserted.insertId))
      .limit(1);
    
    return newRecord[0];
  }

  async update(schoolId: number, id: number, teacherData: Partial<typeof teachers.$inferInsert>) {
    await db
      .update(teachers)
      .set({
        ...teacherData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teachers.schoolId, schoolId),
          eq(teachers.id, id),
          isNull(teachers.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(teachers)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(teachers.schoolId, schoolId),
          eq(teachers.id, id),
          isNull(teachers.deletedAt)
        )
      );
  }
}
