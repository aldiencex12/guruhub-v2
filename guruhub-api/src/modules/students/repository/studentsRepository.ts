import { eq, and, isNull, or, like, sql, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { students } from "../../../schema/students";

export class StudentsRepository {
  async findAll(
    schoolId: number,
    options: { page: number; limit: number; search?: string; status?: "Aktif" | "Nonaktif" },
    allowedStudentIds?: number[]
  ) {
    const offset = (options.page - 1) * options.limit;

    const conditions: any[] = [
      eq(students.schoolId, schoolId),
      isNull(students.deletedAt)
    ];

    if (allowedStudentIds) {
      conditions.push(inArray(students.id, allowedStudentIds));
    }

    if (options.status) {
      conditions.push(eq(students.status, options.status));
    }

    if (options.search) {
      conditions.push(
        or(
          like(students.name, `%${options.search}%`),
          like(students.nisn, `%${options.search}%`)
        )
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count || 0);
    const totalPages = Math.ceil(totalItems / options.limit);

    const data = await db
      .select()
      .from(students)
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
      .from(students)
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.id, id),
          isNull(students.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByNisn(nisn: string) {
    // Hanya cek siswa yang belum dihapus (soft delete)
    const result = await db
      .select()
      .from(students)
      .where(and(eq(students.nisn, nisn), isNull(students.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, studentData: Omit<typeof students.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(students).values({
      ...studentData,
      schoolId,
    });
    
    const newRecord = await db
      .select()
      .from(students)
      .where(eq(students.id, inserted.insertId))
      .limit(1);
    
    return newRecord[0];
  }

  async update(schoolId: number, id: number, studentData: Partial<typeof students.$inferInsert>) {
    await db
      .update(students)
      .set({
        ...studentData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.id, id),
          isNull(students.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(students)
      .set({
        deletedAt: new Date(),
        nisn: null as any, // Bebaskan unique constraint agar NISN bisa dipakai ulang
      })
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.id, id),
          isNull(students.deletedAt)
        )
      );
  }

  async softDeleteBulk(schoolId: number, ids: number[]) {
    await db
      .update(students)
      .set({
        deletedAt: new Date(),
        nisn: null as any, // Bebaskan unique constraint agar NISN bisa dipakai ulang
      })
      .where(
        and(
          eq(students.schoolId, schoolId),
          inArray(students.id, ids),
          isNull(students.deletedAt)
        )
      );
  }
}
