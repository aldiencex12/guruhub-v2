import { eq, and, ne } from "drizzle-orm";
import { db } from "../../../db";
import { academicYears } from "../../../schema/academicYears";

export class AcademicYearsRepository {
  async findAll(schoolId: number) {
    return await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.schoolId, schoolId))
      .orderBy(academicYears.year, academicYears.semester);
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(academicYears)
      .where(
        and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.id, id)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findByYearAndSemester(schoolId: number, year: string, semester: "Ganjil" | "Genap") {
    const result = await db
      .select()
      .from(academicYears)
      .where(
        and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.year, year),
          eq(academicYears.semester, semester)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(schoolId: number, data: Omit<typeof academicYears.$inferInsert, "schoolId">) {
    const [inserted] = await db.insert(academicYears).values({
      ...data,
      schoolId,
    });

    const newRecord = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, inserted.insertId))
      .limit(1);

    return newRecord[0];
  }

  async update(schoolId: number, id: number, data: Partial<typeof academicYears.$inferInsert>) {
    await db
      .update(academicYears)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(academicYears.schoolId, schoolId),
          eq(academicYears.id, id)
        )
      );

    return await this.findById(schoolId, id);
  }

  async deactivateAllOtherYears(schoolId: number, excludeId: number) {
    await db
      .update(academicYears)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(academicYears.schoolId, schoolId),
          ne(academicYears.id, excludeId)
        )
      );
  }
}
