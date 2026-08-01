import { eq, and, isNull, sum, sql, or } from "drizzle-orm";
import { db } from "../../../db";
import { assessmentCategories } from "../../../schema/assessmentCategories";

export class AssessmentCategoriesRepository {
  async findAll(schoolId: number, teacherId?: number | null) {
    const conditions = [
      eq(assessmentCategories.schoolId, schoolId),
      isNull(assessmentCategories.deletedAt)
    ];

    if (teacherId !== undefined) {
      if (teacherId === null) {
        conditions.push(isNull(assessmentCategories.teacherId));
      } else {
        conditions.push(
          or(
            isNull(assessmentCategories.teacherId),
            eq(assessmentCategories.teacherId, teacherId)
          )
        );
      }
    }

    return await db
      .select()
      .from(assessmentCategories)
      .where(and(...conditions));
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(assessmentCategories)
      .where(
        and(
          eq(assessmentCategories.schoolId, schoolId),
          eq(assessmentCategories.id, id),
          isNull(assessmentCategories.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByName(schoolId: number, name: string, teacherId?: number | null) {
    const conditions = [
      eq(assessmentCategories.schoolId, schoolId),
      eq(assessmentCategories.name, name),
      isNull(assessmentCategories.deletedAt)
    ];

    if (teacherId !== undefined) {
      if (teacherId === null) {
        conditions.push(isNull(assessmentCategories.teacherId));
      } else {
        conditions.push(eq(assessmentCategories.teacherId, teacherId));
      }
    }

    const result = await db
      .select()
      .from(assessmentCategories)
      .where(and(...conditions))
      .limit(1);
    return result[0] || null;
  }

  async getTotalWeight(schoolId: number, excludeId?: number, teacherId?: number | null): Promise<number> {
    const conditions = [
      eq(assessmentCategories.schoolId, schoolId),
      eq(assessmentCategories.isActive, true),
      isNull(assessmentCategories.deletedAt),
    ];

    if (teacherId !== undefined) {
      if (teacherId === null) {
        conditions.push(isNull(assessmentCategories.teacherId));
      } else {
        conditions.push(
          or(
            isNull(assessmentCategories.teacherId),
            eq(assessmentCategories.teacherId, teacherId)
          )
        );
      }
    }

    if (excludeId !== undefined) {
      conditions.push(sql`${assessmentCategories.id} <> ${excludeId}`);
    }

    const result = await db
      .select({
        total: sum(assessmentCategories.weight),
      })
      .from(assessmentCategories)
      .where(and(...conditions));

    return result[0]?.total ? parseInt(result[0].total as string, 10) : 0;
  }

  async create(schoolId: number, data: any) {
    const [inserted] = await db.insert(assessmentCategories).values({
      ...data,
      schoolId,
    });
    return await this.findById(schoolId, inserted.insertId);
  }

  async update(schoolId: number, id: number, data: any) {
    await db
      .update(assessmentCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assessmentCategories.schoolId, schoolId),
          eq(assessmentCategories.id, id),
          isNull(assessmentCategories.deletedAt)
        )
      );
    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(assessmentCategories)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(assessmentCategories.schoolId, schoolId),
          eq(assessmentCategories.id, id),
          isNull(assessmentCategories.deletedAt)
        )
      );
  }
}
