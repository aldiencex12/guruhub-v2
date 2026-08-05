import { db } from "../../../db";
import { interimReportCards, interimReportCardSubjects } from "../../../schema/interimReportCards";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { academicYears } from "../../../schema/academicYears";
import { subjects } from "../../../schema/subjects";
import { teachers } from "../../../schema/teachers";
import { classMembers } from "../../../schema/classMembers";
import { attendances, attendanceDetails } from "../../../schema/attendances";
import { schedules } from "../../../schema/schedules";
import { assessments, assessmentScores } from "../../../schema/assessments";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../../errors/customErrors";
import { eq, and, isNull, inArray, or } from "drizzle-orm";

export function calculateInterimScore(tugas1?: number | null, tugas2?: number | null, sts?: number | null): { finalScore: number; gradeLetter: string } {
  const t1 = tugas1 ?? 0;
  const t2 = tugas2 ?? 0;
  const s = sts ?? 0;

  // Formula Disetujui (Opsi B): (Tugas 1 + Tugas 2 + (2 * STS)) / 4
  const finalScore = Math.round((t1 + t2 + (2 * s)) / 4);

  let gradeLetter = "D";
  if (finalScore >= 90) gradeLetter = "A";
  else if (finalScore >= 80) gradeLetter = "B";
  else if (finalScore >= 70) gradeLetter = "C";
  else gradeLetter = "D";

  return { finalScore, gradeLetter };
}

export function isSubjectMatchingStudentReligion(subjectName: string, subjectReligionGroup: string, studentReligion: string): boolean {
  const sNameLower = (subjectName || "").toLowerCase();
  const relLower = (studentReligion || "islam").toLowerCase();

  // 1. Cek apakah ini secara eksplisit merupakan mata pelajaran Agama dari nama mapelnya
  const isAgamaByName =
    sNameLower.includes("agama") ||
    sNameLower.includes("kepercaya") ||
    sNameLower.includes("pai") ||
    sNameLower.includes("pak") ||
    ["islam", "kristen", "katolik", "hindu", "buddha", "khonghucu"].some((r) => sNameLower.includes(r));

  // Jika nama mapel BUKAN mapel Agama (misal B.Indonesia, Matematika, IPA, IPS, B.Inggris, dll.),
  // maka mapel ini BERLAKU UNTUK SEMUA SISWA tanpa terpengaruh kesalahan kategori agama di master data.
  if (!isAgamaByName) {
    return true;
  }

  // 2. Jika memang mapel Agama, cek religionGroup jika ada
  if (subjectReligionGroup && subjectReligionGroup !== "UMUM") {
    return subjectReligionGroup.toLowerCase() === relLower;
  }

  // 3. Deteksi agama spesifik dari kata di nama mapel
  const religions = ["islam", "kristen", "katolik", "hindu", "buddha", "khonghucu"];
  for (const rel of religions) {
    if (sNameLower.includes(rel)) {
      return rel === relLower;
    }
  }

  return true;
}

export function normalizeSubjectKey(name: string): string {
  let norm = (name || "").toLowerCase().trim();
  norm = norm.replace(/-(7|8|9|10|11|12)$/, "");
  norm = norm.replace(/\s+(7|8|9|10|11|12)$/, "");
  if (norm === "bahasa indonesia" || norm === "b.indonesia" || norm === "b indonesia") return "b.indonesia";
  if (norm === "bahasa inggris" || norm === "b.inggris" || norm === "b inggris") return "b.inggris";
  if (norm === "ppkn" || norm === "pancasila" || norm === "ppkn / pancasila") return "pancasila";
  if (norm === "seni budaya" || norm === "seni rupa" || norm === "seni") return "seni rupa";
  if (norm.includes("pendidikan agama islam") || norm === "pai") return "pai";
  if (norm.includes("pendidikan agama kristen") || norm === "pak") return "pak";
  return norm;
}

export function isAttendanceInSemester(attendanceDate: string | Date | null | undefined, semester: string): boolean {
  if (!attendanceDate) return true;
  const dateStr = typeof attendanceDate === "string" 
    ? attendanceDate 
    : attendanceDate instanceof Date 
      ? attendanceDate.toISOString().slice(0, 10) 
      : String(attendanceDate);

  const parts = dateStr.split("-");
  if (parts.length < 2) return true;
  const month = parseInt(parts[1], 10);
  if (isNaN(month)) return true;

  const semUpper = (semester || "").toUpperCase().trim();
  if (semUpper === "GANJIL" || semUpper === "1" || semUpper === "SEMESTER 1" || semUpper === "SEMESTER GANJIL") {
    return month >= 7 && month <= 12;
  } else if (semUpper === "GENAP" || semUpper === "2" || semUpper === "SEMESTER 2" || semUpper === "SEMESTER GENAP") {
    return month >= 1 && month <= 6;
  }
  return true;
}

export class InterimReportCardService {
  /**
   * Mengambil atau membuat draf Raport Sisipan untuk siswa tertentu
   */
  async generateOrGetInterimReportCard(
    schoolId: number,
    payload: {
      studentId: number;
      academicYearId: number;
      semester: "GANJIL" | "GENAP";
    }
  ) {
    const { studentId, academicYearId, semester } = payload;

    // 1. Validasi Siswa
    const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (!student) throw new NotFoundError("Siswa tidak ditemukan");
    if (student.schoolId !== schoolId) throw new ForbiddenError("Akses ditolak (Tenant Isolation)");

    // 2. Validasi Keanggotaan Kelas
    const [member] = await db
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
    if (!member) throw new BadRequestError("Siswa tidak berstatus ACTIVE di kelas pada tahun ajaran ini");
    const classId = member.classId;

    // Ambil data kelas untuk mengetahui tingkat kelas (gradeLevel, misal '7')
    const [classObj] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);

    // 3. Cek Rapor Sisipan Eksis
    const [existing] = await db
      .select()
      .from(interimReportCards)
      .where(
        and(
          eq(interimReportCards.studentId, studentId),
          eq(interimReportCards.academicYearId, academicYearId),
          eq(interimReportCards.semester, semester),
          isNull(interimReportCards.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      return this.getInterimReportCardDetails(schoolId, existing.id);
    }

    // 4. Hitung absensi otomatis (filtered by semester)
    const studentAttendanceDetails = await db
      .select({
        status: attendanceDetails.status,
        attendanceDate: attendances.attendanceDate,
      })
      .from(attendanceDetails)
      .innerJoin(attendances, eq(attendanceDetails.attendanceId, attendances.id))
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .where(
        and(
          eq(attendanceDetails.studentId, studentId),
          eq(schedules.academicYearId, academicYearId),
          isNull(attendances.deletedAt)
        )
      );

    let sickCount = 0, permissionCount = 0, absentCount = 0;
    for (const att of studentAttendanceDetails) {
      if (!isAttendanceInSemester(att.attendanceDate, semester)) continue;

      if (att.status === "SICK") sickCount++;
      else if (att.status === "PERMISSION") permissionCount++;
      else if (att.status === "ABSENT") absentCount++;
    }

    // 5. Buat rekor draf Rapor Sisipan
    const [inserted] = await db.insert(interimReportCards).values({
      schoolId,
      studentId,
      classId,
      academicYearId,
      semester,
      status: "DRAFT",
      sick: sickCount,
      permission: permissionCount,
      absent: absentCount,
    });
    const interimReportCardId = inserted.insertId;

    // 6. Ambil semua mata pelajaran AKTIF yang SESUAI TINGKAT KELAS ini (misal Kelas 7)
    const subjectConditions = [eq(subjects.schoolId, schoolId), eq(subjects.status, "Aktif"), isNull(subjects.deletedAt)];
    if (classObj?.gradeLevel) {
      subjectConditions.push(eq(subjects.gradeLevel, classObj.gradeLevel));
    }

    const classSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        religionGroup: subjects.religionGroup,
        gradeLevel: subjects.gradeLevel,
      })
      .from(subjects)
      .where(and(...subjectConditions));

    // 7. Ambil skor asesmen TUGAS_1, TUGAS_2, STS yang ada di DB
    const studentAssessments = await db
      .select({
        subjectId: assessments.subjectId,
        assessmentType: assessments.assessmentType,
        score: assessmentScores.score,
      })
      .from(assessmentScores)
      .innerJoin(assessments, eq(assessmentScores.assessmentId, assessments.id))
      .where(
        and(
          eq(assessmentScores.studentId, studentId),
          eq(assessments.schoolId, schoolId),
          eq(assessments.academicYearId, academicYearId)
        )
      );

    // Grouping nilai per subjek
    const subjectScoresMap = new Map<number, { t1?: number; t2?: number; sts?: number }>();
    for (const sa of studentAssessments) {
      const current = subjectScoresMap.get(sa.subjectId) || {};
      if (sa.assessmentType === "TUGAS_1") current.t1 = sa.score;
      else if (sa.assessmentType === "TUGAS_2") current.t2 = sa.score;
      else if (sa.assessmentType === "STS" || sa.assessmentType === "MIDTERM") current.sts = sa.score;
      subjectScoresMap.set(sa.subjectId, current);
    }

    // 8. Filter Agama & Simpan Rapor Sisipan per Subjek
    for (const subj of classSubjects) {
      if (!isSubjectMatchingStudentReligion(subj.name, subj.religionGroup, student.religion)) {
        continue; // Lewati mapel agama lain
      }

      const scores = subjectScoresMap.get(subj.id) || {};
      const { finalScore, gradeLetter } = calculateInterimScore(scores.t1, scores.t2, scores.sts);

      await db.insert(interimReportCardSubjects).values({
        interimReportCardId,
        subjectId: subj.id,
        tugas1: scores.t1 ?? null,
        tugas2: scores.t2 ?? null,
        sts: scores.sts ?? null,
        finalScore,
        gradeLetter,
      });
    }

    return this.getInterimReportCardDetails(schoolId, interimReportCardId);
  }

  /**
   * Auto-sync missing active subjects matching gradeLevel & religion into interimReportCardSubjects
   */
  private async syncReportCardSubjects(
    interimReportCardId: number,
    schoolId: number,
    studentId: number,
    classGradeLevel: string | null,
    studentReligion: string
  ) {
    if (!classGradeLevel) return;

    // 1. Ambil semua mapel aktif yang sesuai grade level kelas
    const classSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        religionGroup: subjects.religionGroup,
        gradeLevel: subjects.gradeLevel,
      })
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, schoolId),
          eq(subjects.status, "Aktif"),
          eq(subjects.gradeLevel, classGradeLevel as any),
          isNull(subjects.deletedAt)
        )
      );

    // 2. Ambil subjectId yang sudah ada di interimReportCardSubjects untuk rapor ini
    const existingRcSubjects = await db
      .select({ subjectId: interimReportCardSubjects.subjectId })
      .from(interimReportCardSubjects)
      .where(eq(interimReportCardSubjects.interimReportCardId, interimReportCardId));

    const existingSubjectIds = new Set(existingRcSubjects.map((s) => s.subjectId));

    // 3. Cari mapel baru yang belum ada & sesuai agama siswa
    const missingSubjects = classSubjects.filter(
      (subj) =>
        !existingSubjectIds.has(subj.id) &&
        isSubjectMatchingStudentReligion(subj.name, subj.religionGroup, studentReligion)
    );

    if (missingSubjects.length === 0) return;

    // 4. Hitung skor awal dari assessmentScores jika ada
    const studentAssessments = await db
      .select({
        subjectId: assessments.subjectId,
        assessmentType: assessments.assessmentType,
        score: assessmentScores.score,
      })
      .from(assessmentScores)
      .innerJoin(assessments, eq(assessmentScores.assessmentId, assessments.id))
      .where(
        and(
          eq(assessmentScores.studentId, studentId),
          eq(assessments.schoolId, schoolId)
        )
      );

    const subjectScoresMap = new Map<number, { t1?: number; t2?: number; sts?: number }>();
    for (const sa of studentAssessments) {
      const current = subjectScoresMap.get(sa.subjectId) || {};
      if (sa.assessmentType === "TUGAS_1") current.t1 = sa.score;
      else if (sa.assessmentType === "TUGAS_2") current.t2 = sa.score;
      else if (sa.assessmentType === "STS" || sa.assessmentType === "MIDTERM") current.sts = sa.score;
      subjectScoresMap.set(sa.subjectId, current);
    }

    for (const subj of missingSubjects) {
      const scores = subjectScoresMap.get(subj.id) || {};
      const { finalScore, gradeLetter } = calculateInterimScore(scores.t1, scores.t2, scores.sts);

      await db.insert(interimReportCardSubjects).values({
        interimReportCardId,
        subjectId: subj.id,
        tugas1: scores.t1 ?? null,
        tugas2: scores.t2 ?? null,
        sts: scores.sts ?? null,
        finalScore,
        gradeLetter,
      });
    }
  }

  /**
   * Mengambil detail Rapor Sisipan dengan sinkronisasi absensi otomatis
   */
  async getInterimReportCardDetails(schoolId: number, interimReportCardId: number) {
    const [rc] = await db
      .select({
        id: interimReportCards.id,
        schoolId: interimReportCards.schoolId,
        studentId: interimReportCards.studentId,
        classId: interimReportCards.classId,
        academicYearId: interimReportCards.academicYearId,
        semester: interimReportCards.semester,
        status: interimReportCards.status,
        homeroomTeacherNotes: interimReportCards.homeroomTeacherNotes,
        sick: interimReportCards.sick,
        permission: interimReportCards.permission,
        absent: interimReportCards.absent,
        createdAt: interimReportCards.createdAt,
        updatedAt: interimReportCards.updatedAt,
        student: { id: students.id, name: students.name, nisn: students.nisn, religion: students.religion, gender: students.gender },
        class: {
          id: classes.id,
          name: classes.name,
          gradeLevel: classes.gradeLevel,
        },
        homeroomTeacherId: teachers.id,
        homeroomTeacherName: teachers.name,
        academicYear: { id: academicYears.id, year: academicYears.year }
      })
      .from(interimReportCards)
      .leftJoin(students, eq(interimReportCards.studentId, students.id))
      .leftJoin(classes, eq(interimReportCards.classId, classes.id))
      .leftJoin(teachers, eq(classes.homeroomTeacherId, teachers.id))
      .leftJoin(academicYears, eq(interimReportCards.academicYearId, academicYears.id))
      .where(and(eq(interimReportCards.id, interimReportCardId), isNull(interimReportCards.deletedAt)))
      .limit(1);

    if (!rc) throw new NotFoundError("Raport Sisipan tidak ditemukan");
    if (rc.schoolId !== schoolId) throw new ForbiddenError("Akses ditolak (Tenant Isolation)");

    // Auto-sync subjek baru yang sesuai grade level & agama siswa
    const studentReligion = rc.student?.religion;
    const classGradeLevel = rc.class?.gradeLevel;
    if (classGradeLevel && studentReligion) {
      await this.syncReportCardSubjects(
        interimReportCardId,
        schoolId,
        rc.studentId,
        classGradeLevel,
        studentReligion
      );
    }

    // Sinkronisasi absensi real-time dari tabel attendance_details (filtered by semester)
    const studentAttendanceDetails = await db
      .select({
        status: attendanceDetails.status,
        attendanceDate: attendances.attendanceDate,
      })
      .from(attendanceDetails)
      .innerJoin(attendances, eq(attendanceDetails.attendanceId, attendances.id))
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .where(
        and(
          eq(attendanceDetails.studentId, rc.studentId),
          eq(schedules.academicYearId, rc.academicYearId),
          isNull(attendances.deletedAt)
        )
      );

    let sickCount = 0, permissionCount = 0, absentCount = 0;
    for (const att of studentAttendanceDetails) {
      if (!isAttendanceInSemester(att.attendanceDate, rc.semester)) continue;

      if (att.status === "SICK") sickCount++;
      else if (att.status === "PERMISSION") permissionCount++;
      else if (att.status === "ABSENT") absentCount++;
    }

    if (rc.sick !== sickCount || rc.permission !== permissionCount || rc.absent !== absentCount) {
      await db
        .update(interimReportCards)
        .set({ sick: sickCount, permission: permissionCount, absent: absentCount, updatedAt: new Date() })
        .where(eq(interimReportCards.id, interimReportCardId));
      rc.sick = sickCount;
      rc.permission = permissionCount;
      rc.absent = absentCount;
    }

    // Subjek & Nilai
    const subjectsDetail = await db
      .select({
        id: interimReportCardSubjects.id,
        subjectId: interimReportCardSubjects.subjectId,
        tugas1: interimReportCardSubjects.tugas1,
        tugas2: interimReportCardSubjects.tugas2,
        sts: interimReportCardSubjects.sts,
        finalScore: interimReportCardSubjects.finalScore,
        gradeLetter: interimReportCardSubjects.gradeLetter,
        notes: interimReportCardSubjects.notes,
        subject: { id: subjects.id, name: subjects.name, code: subjects.code, religionGroup: subjects.religionGroup, gradeLevel: subjects.gradeLevel }
      })
      .from(interimReportCardSubjects)
      .leftJoin(subjects, eq(interimReportCardSubjects.subjectId, subjects.id))
      .where(eq(interimReportCardSubjects.interimReportCardId, interimReportCardId));

    // Auto-cleanup DB: Hapus otomatis subjek yang beda gradeLevel, beda Agama, atau Duplikat Nama
    if (rc.class?.gradeLevel && rc.student?.religion) {
      const validSubjects = subjectsDetail.filter((s) => {
        if (!s.subject) return false;
        if (s.subject.gradeLevel && String(s.subject.gradeLevel) !== String(rc.class.gradeLevel)) {
          return false;
        }
        return isSubjectMatchingStudentReligion(s.subject.name, s.subject.religionGroup, rc.student.religion);
      });

      // Deduplikasi nama mapel: Hanya simpan 1 mapel per nama yang di-normalisasi (utamakan kode MP...)
      const keptIds = new Set<number>();
      const normMap = new Map<string, any>();

      for (const s of validSubjects) {
        if (!s.subject) continue;
        const key = normalizeSubjectKey(s.subject.name);
        const existing = normMap.get(key);
        if (!existing) {
          normMap.set(key, s);
        } else {
          const sIsMP = s.subject.code?.startsWith("MP");
          const existingIsMP = existing.subject?.code?.startsWith("MP");
          if (sIsMP && !existingIsMP) {
            normMap.set(key, s);
          }
        }
      }

      for (const s of normMap.values()) {
        keptIds.add(s.id);
      }

      const rowIdsToDelete = subjectsDetail
        .filter((s) => !keptIds.has(s.id))
        .map((s) => s.id);

      if (rowIdsToDelete.length > 0) {
        await db.delete(interimReportCardSubjects).where(inArray(interimReportCardSubjects.id, rowIdsToDelete));
      }
    }

    // Ambil ulang data subjek terbersih setelah cleanup
    const cleanSubjectsDetail = await db
      .select({
        id: interimReportCardSubjects.id,
        subjectId: interimReportCardSubjects.subjectId,
        tugas1: interimReportCardSubjects.tugas1,
        tugas2: interimReportCardSubjects.tugas2,
        sts: interimReportCardSubjects.sts,
        finalScore: interimReportCardSubjects.finalScore,
        gradeLetter: interimReportCardSubjects.gradeLetter,
        notes: interimReportCardSubjects.notes,
        subject: { id: subjects.id, name: subjects.name, code: subjects.code, religionGroup: subjects.religionGroup, gradeLevel: subjects.gradeLevel }
      })
      .from(interimReportCardSubjects)
      .leftJoin(subjects, eq(interimReportCardSubjects.subjectId, subjects.id))
      .where(eq(interimReportCardSubjects.interimReportCardId, interimReportCardId));

    return {
      ...rc,
      class: rc.class ? {
        ...rc.class,
        homeroomTeacher: rc.homeroomTeacherName ? { id: rc.homeroomTeacherId, name: rc.homeroomTeacherName } : null
      } : null,
      subjects: cleanSubjectsDetail,
    };
  }

  /**
   * Mengambil semua Rapor Sisipan satu kelas
   */
  async getClassInterimReportCards(
    schoolId: number,
    classId: number,
    academicYearId: number,
    semester: "GANJIL" | "GENAP"
  ) {
    // 1. Ambil daftar siswa di kelas
    const members = await db
      .select({ studentId: classMembers.studentId })
      .from(classMembers)
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE")
        )
      );

    const results = [];
    for (const m of members) {
      const details = await this.generateOrGetInterimReportCard(schoolId, {
        studentId: m.studentId,
        academicYearId,
        semester,
      });
      results.push(details);
    }
    return results;
  }

  /**
   * Update Nilai Sisipan secara masal untuk 1 mapel & 1 kelas
   */
  async batchSaveInterimGrades(
    schoolId: number,
    payload: {
      classId: number;
      subjectId: number;
      academicYearId: number;
      semester: "GANJIL" | "GENAP";
      grades: Array<{
        studentId: number;
        tugas1?: number | null;
        tugas2?: number | null;
        sts?: number | null;
        notes?: string;
      }>;
    }
  ) {
    const { classId, subjectId, academicYearId, semester, grades } = payload;

    for (const g of grades) {
      const rc = await this.generateOrGetInterimReportCard(schoolId, {
        studentId: g.studentId,
        academicYearId,
        semester,
      });

      const { finalScore, gradeLetter } = calculateInterimScore(g.tugas1, g.tugas2, g.sts);

      // Cek apakah subject sudah ada di interimReportCardSubjects
      const [existingSubj] = await db
        .select()
        .from(interimReportCardSubjects)
        .where(
          and(
            eq(interimReportCardSubjects.interimReportCardId, rc.id),
            eq(interimReportCardSubjects.subjectId, subjectId)
          )
        )
        .limit(1);

      if (existingSubj) {
        await db
          .update(interimReportCardSubjects)
          .set({
            tugas1: g.tugas1 ?? null,
            tugas2: g.tugas2 ?? null,
            sts: g.sts ?? null,
            finalScore,
            gradeLetter,
            notes: g.notes ?? null,
          })
          .where(eq(interimReportCardSubjects.id, existingSubj.id));
      } else {
        await db.insert(interimReportCardSubjects).values({
          interimReportCardId: rc.id,
          subjectId,
          tugas1: g.tugas1 ?? null,
          tugas2: g.tugas2 ?? null,
          sts: g.sts ?? null,
          finalScore,
          gradeLetter,
          notes: g.notes ?? null,
        });
      }
    }

    return { success: true, count: grades.length };
  }

  /**
   * Update catatan wali kelas / kehadiran di Rapor Sisipan
   */
  async updateInterimNotes(
    schoolId: number,
    interimReportCardId: number,
    data: { homeroomTeacherNotes?: string; sick?: number; permission?: number; absent?: number }
  ) {
    const [rc] = await db
      .select()
      .from(interimReportCards)
      .where(and(eq(interimReportCards.id, interimReportCardId), isNull(interimReportCards.deletedAt)))
      .limit(1);

    if (!rc) throw new NotFoundError("Raport Sisipan tidak ditemukan");
    if (rc.schoolId !== schoolId) throw new ForbiddenError("Akses ditolak (Tenant Isolation)");

    await db
      .update(interimReportCards)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(interimReportCards.id, interimReportCardId));

    return { id: interimReportCardId, success: true };
  }
}
