import { db } from "../../../db";
import { students } from "../../../schema/students";
import { classMembers } from "../../../schema/classMembers";
import { assessmentCategories } from "../../../schema/assessmentCategories";
import { assessments, assessmentScores } from "../../../schema/assessments";
import { studentFinalGrades } from "../../../schema/studentFinalGrades";
import { calculateGradeLetter } from "../../../utils/gradeCalculator";
import { NotFoundError, BadRequestError } from "../../../errors/customErrors";
import { eq, and, isNull, inArray } from "drizzle-orm";

export class GradeEngineService {
  async calculateStudentFinalGrade(
    schoolId: number,
    studentId: number,
    subjectId: number,
    academicYearId: number
  ) {
    // 1. Validasi siswa eksis
    const studentQuery = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    const student = studentQuery[0];
    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }
    if (student.schoolId !== schoolId) {
      throw new BadRequestError("Siswa tidak terdaftar di sekolah ini");
    }

    // 2. Validasi status ACTIVE di class_members
    const memberQuery = await db
      .select()
      .from(classMembers)
      .where(
        and(
          eq(classMembers.studentId, studentId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE")
        )
      )
      .limit(1);
    const member = memberQuery[0];
    if (!member) {
      throw new BadRequestError("Siswa tidak berstatus ACTIVE di kelas pada tahun ajaran ini");
    }
    const classId = member.classId;

    // 3. Ambil semua kategori penilaian aktif sekolah
    const categories = await db
      .select()
      .from(assessmentCategories)
      .where(
        and(
          eq(assessmentCategories.schoolId, schoolId),
          isNull(assessmentCategories.deletedAt)
        )
      );

    // 4. Ambil semua assessment aktif untuk kelas, subjek, & tahun ajaran
    const activeAssessments = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.classId, classId),
          eq(assessments.subjectId, subjectId),
          eq(assessments.academicYearId, academicYearId),
          isNull(assessments.deletedAt)
        )
      );

    let finalScore = 0;

    if (activeAssessments.length > 0) {
      const assessmentIds = activeAssessments.map((a) => a.id);

      // Ambil nilai siswa untuk asesmen-asesmen tersebut
      const scores = await db
        .select()
        .from(assessmentScores)
        .where(
          and(
            inArray(assessmentScores.assessmentId, assessmentIds),
            eq(assessmentScores.studentId, studentId)
          )
        );

      const scoreMap = new Map<number, number>();
      for (const s of scores) {
        scoreMap.set(s.assessmentId, s.score);
      }

      // Kelompokkan assessment berdasarkan categoryId
      const categoryAssessments = new Map<number, typeof assessments.$inferSelect[]>();
      for (const a of activeAssessments) {
        if (!a.categoryId) continue;
        if (!categoryAssessments.has(a.categoryId)) {
          categoryAssessments.set(a.categoryId, []);
        }
        categoryAssessments.get(a.categoryId)!.push(a);
      }

      // Hitung rata-rata tertimbang
      let weightedScoreSum = 0;

      for (const cat of categories) {
        const catAssessments = categoryAssessments.get(cat.id) || [];
        if (catAssessments.length === 0) {
          // Bobot kategori dianggap 0 jika tidak ada assessment
          continue;
        }

        let catScoreSum = 0;
        let catScoreCount = 0;

        for (const a of catAssessments) {
          const sVal = scoreMap.get(a.id);
          // Jika tidak ada nilai terinput, anggap 0
          catScoreSum += sVal !== undefined ? sVal : 0;
          catScoreCount++;
        }

        const catAvg = catScoreCount > 0 ? catScoreSum / catScoreCount : 0;
        weightedScoreSum += catAvg * (cat.weight / 100);
      }

      finalScore = Math.round(weightedScoreSum * 100) / 100;
    }

    const gradeLetter = calculateGradeLetter(finalScore);

    // 5. Upsert ke student_final_grades
    const existingGrade = await db
      .select()
      .from(studentFinalGrades)
      .where(
        and(
          eq(studentFinalGrades.studentId, studentId),
          eq(studentFinalGrades.subjectId, subjectId),
          eq(studentFinalGrades.academicYearId, academicYearId)
        )
      )
      .limit(1);

    if (existingGrade[0]) {
      await db
        .update(studentFinalGrades)
        .set({
          classId,
          finalScore,
          gradeLetter,
          calculatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(studentFinalGrades.id, existingGrade[0].id));
    } else {
      await db.insert(studentFinalGrades).values({
        schoolId,
        studentId,
        classId,
        subjectId,
        academicYearId,
        finalScore,
        gradeLetter,
        calculatedAt: new Date(),
      });
    }

    return {
      finalScore,
      gradeLetter,
    };
  }

  async calculateClassFinalGrades(
    schoolId: number,
    classId: number,
    subjectId: number,
    academicYearId: number
  ) {
    // Ambil semua siswa aktif di kelas tersebut
    const activeMembers = await db
      .select({
        studentId: classMembers.studentId,
        studentName: students.name,
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE"),
          eq(classMembers.schoolId, schoolId)
        )
      );

    const results = [];
    for (const member of activeMembers) {
      const res = await this.calculateStudentFinalGrade(
        schoolId,
        member.studentId,
        subjectId,
        academicYearId
      );
      results.push({
        studentId: member.studentId,
        student: { name: member.studentName },
        ...res,
      });
    }

    return results;
  }

  async getStudentFinalGrade(
    schoolId: number,
    studentId: number,
    subjectId: number,
    academicYearId: number
  ) {
    const result = await db
      .select()
      .from(studentFinalGrades)
      .where(
        and(
          eq(studentFinalGrades.schoolId, schoolId),
          eq(studentFinalGrades.studentId, studentId),
          eq(studentFinalGrades.subjectId, subjectId),
          eq(studentFinalGrades.academicYearId, academicYearId)
        )
      )
      .limit(1);

    const grade = result[0];
    if (!grade) {
      throw new NotFoundError("Hasil perhitungan nilai akhir tidak ditemukan");
    }

    return grade;
  }
}
