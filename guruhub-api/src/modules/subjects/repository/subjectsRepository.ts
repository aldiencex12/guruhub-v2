import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { subjects } from "../../../schema/subjects";

export class SubjectsRepository {
  async findAll(schoolId: number, allowedSubjectIds?: number[]) {
    const conditions = [
      eq(subjects.schoolId, schoolId),
      isNull(subjects.deletedAt)
    ];

    if (allowedSubjectIds) {
      conditions.push(inArray(subjects.id, allowedSubjectIds));
    }

    return await db
      .select()
      .from(subjects)
      .where(and(...conditions));
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.id, id),
          isNull(subjects.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByCode(schoolId: number, code: string) {
    const result = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.code, code),
          isNull(subjects.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByName(schoolId: number, name: string) {
    const result = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.name, name),
          isNull(subjects.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByNameAndGrade(schoolId: number, name: string, gradeLevel: string) {
    const result = await db
      .select()
      .from(subjects)
      .where(and(
        eq(subjects.schoolId, schoolId), 
        eq(subjects.name, name), 
        eq(subjects.gradeLevel, gradeLevel as any),
        isNull(subjects.deletedAt)
      ))
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, subjectData: Omit<typeof subjects.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(subjects).values({
      ...subjectData,
      schoolId,
    });

    const newRecord = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, inserted.insertId))
      .limit(1);

    return newRecord[0];
  }

  async update(schoolId: number, id: number, subjectData: Partial<typeof subjects.$inferInsert>) {
    await db
      .update(subjects)
      .set({
        ...subjectData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.id, id),
          isNull(subjects.deletedAt)
        )
      );

    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(subjects)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.id, id),
          isNull(subjects.deletedAt)
        )
      );
  }

  async softDeleteBulk(schoolId: number, ids: number[]) {
    await db
      .update(subjects)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          inArray(subjects.id, ids),
          isNull(subjects.deletedAt)
        )
      );
  }
}
