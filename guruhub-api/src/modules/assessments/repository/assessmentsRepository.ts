import { eq, and, isNull, or, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { assessments, assessmentScores } from "../../../schema/assessments";
import { students } from "../../../schema/students";

export class AssessmentsRepository {
  async findAll(
    schoolId: number,
    filters: { classId?: number; subjectId?: number; teacherId?: number; assessmentType?: string; academicYearId?: number; allowedHomeroomClassIds?: number[] }
  ) {
    const conditions = [
      eq(assessments.schoolId, schoolId),
      isNull(assessments.deletedAt),
    ];

    if (filters.classId !== undefined) {
      conditions.push(eq(assessments.classId, filters.classId));
    }
    if (filters.subjectId !== undefined) {
      conditions.push(eq(assessments.subjectId, filters.subjectId));
    }
    
    if (filters.teacherId !== undefined) {
      if (filters.allowedHomeroomClassIds && filters.allowedHomeroomClassIds.length > 0) {
        conditions.push(
          or(
            eq(assessments.teacherId, filters.teacherId),
            inArray(assessments.classId, filters.allowedHomeroomClassIds)
          )
        );
      } else {
        conditions.push(eq(assessments.teacherId, filters.teacherId));
      }
    } else if (filters.allowedHomeroomClassIds && filters.allowedHomeroomClassIds.length > 0) {
      conditions.push(inArray(assessments.classId, filters.allowedHomeroomClassIds));
    }
    if (filters.assessmentType !== undefined) {
      conditions.push(eq(assessments.assessmentType, filters.assessmentType as any));
    }
    if (filters.academicYearId !== undefined) {
      conditions.push(eq(assessments.academicYearId, filters.academicYearId));
    }

    const results = await db
      .select()
      .from(assessments)
      .where(and(...conditions));

    if (results.length === 0) return [];

    const assessmentIds = results.map(a => a.id);
    const scoresList = await db
      .select()
      .from(assessmentScores)
      .where(inArray(assessmentScores.assessmentId, assessmentIds));

    return results.map(a => {
      const scores = scoresList.filter(s => s.assessmentId === a.id);
      return {
        ...a,
        scores
      };
    });
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.schoolId, schoolId),
          eq(assessments.id, id),
          isNull(assessments.deletedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async findDetailWithScores(schoolId: number, id: number) {
    const assessment = await this.findById(schoolId, id);
    if (!assessment) return null;

    const scoresList = await db
      .select({
        id: assessmentScores.id,
        studentId: assessmentScores.studentId,
        studentName: students.name,
        score: assessmentScores.score,
        notes: assessmentScores.notes,
        createdAt: assessmentScores.createdAt,
        updatedAt: assessmentScores.updatedAt,
      })
      .from(assessmentScores)
      .innerJoin(students, eq(assessmentScores.studentId, students.id))
      .where(eq(assessmentScores.assessmentId, id));

    return {
      ...assessment,
      scores: scoresList,
    };
  }

  async create(schoolId: number, data: any) {
    const [inserted] = await db.insert(assessments).values({
      ...data,
      schoolId,
    });
    return await this.findById(schoolId, inserted.insertId);
  }

  async update(schoolId: number, id: number, data: any) {
    await db
      .update(assessments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assessments.schoolId, schoolId),
          eq(assessments.id, id),
          isNull(assessments.deletedAt)
        )
      );
    return await this.findById(schoolId, id);
  }

  async softDelete(schoolId: number, id: number) {
    await db
      .update(assessments)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(assessments.schoolId, schoolId),
          eq(assessments.id, id),
          isNull(assessments.deletedAt)
        )
      );
  }

  async upsertScores(assessmentId: number, scoresList: { studentId: number; score: number; notes?: string | null }[]) {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const item of scoresList) {
        const existing = await tx
          .select()
          .from(assessmentScores)
          .where(
            and(
              eq(assessmentScores.assessmentId, assessmentId),
              eq(assessmentScores.studentId, item.studentId)
            )
          )
          .limit(1);

        const first = existing[0];
        if (first) {
          await tx
            .update(assessmentScores)
            .set({
              score: item.score,
              notes: item.notes ?? null,
              updatedAt: new Date(),
            })
            .where(eq(assessmentScores.id, first.id));

          results.push({
            ...first,
            score: item.score,
            notes: item.notes ?? null,
            updatedAt: new Date(),
          });
        } else {
          const [inserted] = await tx.insert(assessmentScores).values({
            assessmentId,
            studentId: item.studentId,
            score: item.score,
            notes: item.notes ?? null,
          });

          results.push({
            id: inserted.insertId,
            assessmentId,
            studentId: item.studentId,
            score: item.score,
            notes: item.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
      return results;
    });
  }
}
