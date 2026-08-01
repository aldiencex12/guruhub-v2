import { eq, and, isNull, or, like, sql, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { classes } from "../../../schema/classes";

export class ClassesRepository {
  async findAll(
    schoolId: number,
    options: { page: number; limit: number; search?: string; status?: "Aktif" | "Nonaktif"; allowedClassIds?: number[] }
  ) {
    const offset = (options.page - 1) * options.limit;

    const conditions: any[] = [
      eq(classes.schoolId, schoolId),
      isNull(classes.deletedAt)
    ];

    if (options.status) {
      conditions.push(eq(classes.status, options.status));
    }

    if (options.search) {
      conditions.push(like(classes.name, `%${options.search}%`));
    }

    if (options.allowedClassIds) {
      conditions.push(inArray(classes.id, options.allowedClassIds));
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count || 0);
    const totalPages = Math.ceil(totalItems / options.limit);

    const data = await db
      .select()
      .from(classes)
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
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, schoolId),
          eq(classes.id, id),
          isNull(classes.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByName(schoolId: number, academicYearId: number, name: string) {
    const result = await db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, schoolId),
          eq(classes.academicYearId, academicYearId),
          eq(classes.name, name),
          isNull(classes.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, classData: Omit<typeof classes.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(classes).values({
      ...classData,
      schoolId,
    });

    const newRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, inserted.insertId))
      .limit(1);

    return newRecord[0];
  }

  async update(schoolId: number, id: number, classData: Partial<typeof classes.$inferInsert>) {
    await db
      .update(classes)
      .set({
        ...classData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(classes.schoolId, schoolId),
          eq(classes.id, id),
          isNull(classes.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(classes)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(classes.schoolId, schoolId),
          eq(classes.id, id),
          isNull(classes.deletedAt)
        )
      );
  }

  async softDeleteBulk(schoolId: number, ids: number[]) {
    await db
      .update(classes)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(classes.schoolId, schoolId),
          inArray(classes.id, ids),
          isNull(classes.deletedAt)
        )
      );
  }
}
