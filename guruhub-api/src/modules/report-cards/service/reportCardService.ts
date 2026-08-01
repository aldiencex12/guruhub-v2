import { db } from "../../../db";
import { reportCards, reportCardSubjects, reportCardAttendances, studentExtracurriculars, studentAchievements, p5Projects, extracurriculars } from "../../../schema/reportCards";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { academicYears } from "../../../schema/academicYears";
import { subjects } from "../../../schema/subjects";
import { teachers } from "../../../schema/teachers";
import { classMembers } from "../../../schema/classMembers";
import { studentFinalGrades } from "../../../schema/studentFinalGrades";
import { attendances, attendanceDetails } from "../../../schema/attendances";
import { schedules } from "../../../schema/schedules";
import { generateReportDescription } from "../../../utils/reportDescriptionGenerator";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../../errors/customErrors";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class ReportCardService {
  /**
   * Menghasilkan rapor baru untuk siswa secara otomatis berdasarkan nilai Grade Engine dan Absensi.
   */
  async generateReportCard(
    schoolId: number,
    payload: {
      studentId: number;
      academicYearId: number;
      semester: "GANJIL" | "GENAP";
    },
    currentUserRole: string
  ) {
    const { studentId, academicYearId, semester } = payload;

    // 1. Validasi Siswa eksis & satu sekolah
    const studentQuery = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    const student = studentQuery[0];
    if (!student) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }
    if (student.schoolId !== schoolId) {
      throw new ForbiddenError("Akses ditolak (Tenant Isolation)");
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

    // 3. Validasi keunikan: satu siswa hanya boleh memiliki 1 rapor per semester per tahun ajaran
    const existingQuery = await db
      .select()
      .from(reportCards)
      .where(
        and(
          eq(reportCards.studentId, studentId),
          eq(reportCards.academicYearId, academicYearId),
          eq(reportCards.semester, semester),
          isNull(reportCards.deletedAt)
        )
      )
      .limit(1);
    
    if (existingQuery[0]) {
      throw new BadRequestError("Siswa sudah memiliki rapor untuk semester dan tahun ajaran ini");
    }

    // 4. Hitung absensi siswa secara otomatis
    const studentAttendanceDetails = await db
      .select({
        status: attendanceDetails.status,
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

    let sickCount = 0;
    let permissionCount = 0;
    let absentCount = 0;

    for (const att of studentAttendanceDetails) {
      if (att.status === "SICK") sickCount++;
      else if (att.status === "PERMISSION") permissionCount++;
      else if (att.status === "ABSENT") absentCount++;
    }

    // 5. Ambil nilai akhir dari Grade Engine
    const finalGrades = await db
      .select()
      .from(studentFinalGrades)
      .where(
        and(
          eq(studentFinalGrades.studentId, studentId),
          eq(studentFinalGrades.academicYearId, academicYearId),
          eq(studentFinalGrades.schoolId, schoolId)
        )
      );

    // 6. Buat rekor rapor utama (DRAFT)
    const [reportCardInsert] = await db.insert(reportCards).values({
      schoolId,
      studentId,
      classId,
      academicYearId,
      semester,
      status: "DRAFT",
    });
    const reportCardId = reportCardInsert.insertId;

    // 7. Simpan detail nilai mapel
    for (const fg of finalGrades) {
      await db.insert(reportCardSubjects).values({
        reportCardId,
        subjectId: fg.subjectId,
        finalScore: fg.finalScore,
        gradeLetter: fg.gradeLetter,
        knowledgeDescription: generateReportDescription(fg.finalScore),
      });
    }

    // 8. Simpan kehadiran
    await db.insert(reportCardAttendances).values({
      reportCardId,
      sick: sickCount,
      permission: permissionCount,
      absent: absentCount,
    });

    return this.getReportCardDetails(schoolId, reportCardId);
  }

  /**
   * Melakukan publikasi rapor (mengubah status menjadi PUBLISHED).
   */
  async publishReportCard(schoolId: number, reportCardId: number) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    if (rc.status === "PUBLISHED") {
      throw new BadRequestError("Rapor sudah dalam status PUBLISHED");
    }

    await db
      .update(reportCards)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(eq(reportCards.id, reportCardId));

    return { id: reportCardId, status: "PUBLISHED" };
  }

  /**
   * Mengambil detail rapor secara terstruktur beserta seluruh relasi.
   */
  async getReportCardDetails(schoolId: number, reportCardId: number) {
    const rcList = await db
      .select({
        id: reportCards.id,
        schoolId: reportCards.schoolId,
        studentId: reportCards.studentId,
        classId: reportCards.classId,
        academicYearId: reportCards.academicYearId,
        semester: reportCards.semester,
        status: reportCards.status,
        homeroomTeacherNotes: reportCards.homeroomTeacherNotes,
        createdAt: reportCards.createdAt,
        updatedAt: reportCards.updatedAt,
        student: { id: students.id, name: students.name, nisn: students.nisn },
        class: { 
          id: classes.id, 
          name: classes.name,
          homeroomTeacher: { id: teachers.id, name: teachers.name }
        },
        academicYear: { id: academicYears.id, name: academicYears.year }
      })
      .from(reportCards)
      .leftJoin(students, eq(reportCards.studentId, students.id))
      .leftJoin(classes, eq(reportCards.classId, classes.id))
      .leftJoin(teachers, eq(classes.homeroomTeacherId, teachers.id))
      .leftJoin(academicYears, eq(reportCards.academicYearId, academicYears.id))
      .where(and(eq(reportCards.id, reportCardId), isNull(reportCards.deletedAt)))
      .limit(1);
    
    const rc = rcList[0];
    if (!rc) {
      throw new NotFoundError("Rapor tidak ditemukan");
    }
    if (rc.schoolId !== schoolId) {
      throw new ForbiddenError("Akses ditolak (Tenant Isolation)");
    }

    // Ambil subjek & nilai
    const subjectsDetail = await db
      .select({
        subjectId: reportCardSubjects.subjectId,
        finalScore: reportCardSubjects.finalScore,
        gradeLetter: reportCardSubjects.gradeLetter,
        knowledgeDescription: reportCardSubjects.knowledgeDescription,
        subject: { id: subjects.id, name: subjects.name }
      })
      .from(reportCardSubjects)
      .leftJoin(subjects, eq(reportCardSubjects.subjectId, subjects.id))
      .where(eq(reportCardSubjects.reportCardId, reportCardId));

    // Ambil kehadiran
    const attendanceDetail = await db
      .select()
      .from(reportCardAttendances)
      .where(eq(reportCardAttendances.reportCardId, reportCardId))
      .limit(1);

    // Ambil ekskul
    const extracurricularsDetail = await db
      .select({
        id: studentExtracurriculars.id,
        extracurricularId: studentExtracurriculars.extracurricularId,
        name: extracurriculars.name,
        predicate: studentExtracurriculars.predicate,
        description: studentExtracurriculars.description,
      })
      .from(studentExtracurriculars)
      .innerJoin(extracurriculars, eq(studentExtracurriculars.extracurricularId, extracurriculars.id))
      .where(eq(studentExtracurriculars.reportCardId, reportCardId));

    // Ambil prestasi
    const achievementsDetail = await db
      .select()
      .from(studentAchievements)
      .where(eq(studentAchievements.reportCardId, reportCardId));

    // Ambil projek P5
    const p5Detail = await db
      .select()
      .from(p5Projects)
      .where(eq(p5Projects.reportCardId, reportCardId));

    return {
      ...rc,
      subjects: subjectsDetail,
      attendance: attendanceDetail[0] || null,
      extracurriculars: extracurricularsDetail,
      achievements: achievementsDetail,
      p5Projects: p5Detail,
    };
  }

  /**
   * Mengambil rapor siswa berdasarkan studentId, academicYearId, dan semester.
   */
  async getStudentReportCard(
    schoolId: number,
    studentId: number,
    query: { academicYearId: number; semester: "GANJIL" | "GENAP" }
  ) {
    const rcList = await db
      .select({ id: reportCards.id, schoolId: reportCards.schoolId })
      .from(reportCards)
      .where(
        and(
          eq(reportCards.studentId, studentId),
          eq(reportCards.academicYearId, query.academicYearId),
          eq(reportCards.semester, query.semester),
          isNull(reportCards.deletedAt)
        )
      )
      .limit(1);

    const rc = rcList[0];
    if (!rc) {
      throw new NotFoundError("Rapor siswa tidak ditemukan");
    }
    if (rc.schoolId !== schoolId) {
      throw new ForbiddenError("Akses ditolak (Tenant Isolation)");
    }

    return this.getReportCardDetails(schoolId, rc.id);
  }

  /**
   * Mengambil semua rapor kelas pada tahun ajaran & semester tertentu.
   */
  async getClassReportCards(
    schoolId: number,
    classId: number,
    query: { academicYearId: number; semester: "GANJIL" | "GENAP" }
  ) {
    const rcList = await db
      .select({ id: reportCards.id, schoolId: reportCards.schoolId })
      .from(reportCards)
      .where(
        and(
          eq(reportCards.classId, classId),
          eq(reportCards.academicYearId, query.academicYearId),
          eq(reportCards.semester, query.semester),
          isNull(reportCards.deletedAt)
        )
      );

    const results = [];
    for (const r of rcList) {
      if (r.schoolId !== schoolId) continue;
      const details = await this.getReportCardDetails(schoolId, r.id);
      results.push(details);
    }
    return results;
  }

  /**
   * Mengambil semua rapor dengan filter opsional.
   */
  async getAllReportCards(
    schoolId: number,
    user: UserContext,
    query: { classId?: number; academicYearId?: number; semester?: "GANJIL" | "GENAP"; status?: "DRAFT" | "PUBLISHED" }
  ) {
    if (user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
      if (homeroomClasses.length > 0) {
        // As a HomeroomTeacher, they can only view report cards for their homeroom classes.
        // We override or filter the classId query.
        const allowedClassIds = homeroomClasses.map(c => c.id);
        if (query.classId) {
          if (!allowedClassIds.includes(query.classId)) {
            query.classId = -1; // Force empty result if they query a class they don't own
          }
        } else {
          // If no specific class is queried, just pick their first homeroom class
          // or ideally change the query to support multiple classIds.
          // Since the existing query uses `eq(reportCards.classId, query.classId)`, we can just use the first one for now
          // (Usually a teacher only has 1 homeroom class).
          query.classId = allowedClassIds[0];
        }
      } else {
        query.classId = -1; // No homeroom classes, so no report cards
      }
    } else if (user.role === "Teacher") {
      query.classId = -1; // Normal teachers cannot view report cards
    }

    const conditions = [
      eq(reportCards.schoolId, schoolId),
      isNull(reportCards.deletedAt)
    ];

    if (query.classId) conditions.push(eq(reportCards.classId, query.classId));
    if (query.academicYearId) conditions.push(eq(reportCards.academicYearId, query.academicYearId));
    if (query.semester) conditions.push(eq(reportCards.semester, query.semester));
    if (query.status) conditions.push(eq(reportCards.status, query.status));

    const rcList = await db
      .select({ id: reportCards.id })
      .from(reportCards)
      .where(and(...conditions));

    const results = [];
    for (const r of rcList) {
      const details = await this.getReportCardDetails(schoolId, r.id);
      results.push(details);
    }
    return results;
  }
  async getClassReportCards(
    schoolId: number,
    classId: number,
    query: { academicYearId: number; semester: "GANJIL" | "GENAP" }
  ) {
    const rcList = await db
      .select({ id: reportCards.id, schoolId: reportCards.schoolId })
      .from(reportCards)
      .where(
        and(
          eq(reportCards.classId, classId),
          eq(reportCards.academicYearId, query.academicYearId),
          eq(reportCards.semester, query.semester),
          isNull(reportCards.deletedAt)
        )
      );

    const results = [];
    for (const r of rcList) {
      if (r.schoolId !== schoolId) continue;
      const details = await this.getReportCardDetails(schoolId, r.id);
      results.push(details);
    }
    return results;
  }

  /**
   * Mengupdate catatan wali kelas.
   */
  async updateHomeroomTeacherNotes(schoolId: number, reportCardId: number, notes: string, currentUserRole: string) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    this.checkPublishedLock(rc.status, currentUserRole);

    await db
      .update(reportCards)
      .set({ homeroomTeacherNotes: notes, updatedAt: new Date() })
      .where(eq(reportCards.id, reportCardId));

    return { id: reportCardId, homeroomTeacherNotes: notes };
  }

  /**
   * Menambahkan prestasi siswa ke rapor.
   */
  async addAchievement(
    schoolId: number,
    reportCardId: number,
    payload: { title: string; level: "SCHOOL" | "DISTRICT" | "PROVINCE" | "NATIONAL" | "INTERNATIONAL"; description?: string },
    currentUserRole: string
  ) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    this.checkPublishedLock(rc.status, currentUserRole);

    const [inserted] = await db.insert(studentAchievements).values({
      reportCardId,
      title: payload.title,
      level: payload.level,
      description: payload.description,
    });

    return { id: inserted.insertId, reportCardId, ...payload };
  }

  /**
   * Menambahkan ekstrakurikuler ke rapor.
   */
  async addExtracurricular(
    schoolId: number,
    reportCardId: number,
    payload: { extracurricularId: number; predicate: "A" | "B" | "C" | "D"; description?: string },
    currentUserRole: string
  ) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    this.checkPublishedLock(rc.status, currentUserRole);

    // Validasi eksistensi & tenant master ekskul
    const extList = await db
      .select()
      .from(extracurriculars)
      .where(and(eq(extracurriculars.id, payload.extracurricularId), isNull(extracurriculars.deletedAt)))
      .limit(1);
    
    if (!extList[0] || extList[0].schoolId !== schoolId) {
      throw new NotFoundError("Ekstrakurikuler tidak ditemukan atau milik sekolah lain");
    }

    const [inserted] = await db.insert(studentExtracurriculars).values({
      reportCardId,
      extracurricularId: payload.extracurricularId,
      predicate: payload.predicate,
      description: payload.description,
    });

    return { id: inserted.insertId, reportCardId, ...payload };
  }

  /**
   * Menambahkan projek P5 ke rapor.
   */
  async addP5Project(
    schoolId: number,
    reportCardId: number,
    payload: { theme: string; predicate: "SB" | "B" | "C" | "PB"; description?: string },
    currentUserRole: string
  ) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    this.checkPublishedLock(rc.status, currentUserRole);

    const [inserted] = await db.insert(p5Projects).values({
      reportCardId,
      theme: payload.theme,
      predicate: payload.predicate,
      description: payload.description,
    });

    return { id: inserted.insertId, reportCardId, ...payload };
  }

  /**
   * Melakukan soft delete rapor.
   */
  async deleteReportCard(schoolId: number, reportCardId: number) {
    const rc = await this.findReportCardOrThrow(schoolId, reportCardId);
    await db
      .update(reportCards)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(reportCards.id, reportCardId));

    return { id: reportCardId, deletedAt: new Date() };
  }

  // --- Helper Methods ---

  private async findReportCardOrThrow(schoolId: number, reportCardId: number) {
    const list = await db
      .select()
      .from(reportCards)
      .where(and(eq(reportCards.id, reportCardId), isNull(reportCards.deletedAt)))
      .limit(1);
    
    const rc = list[0];
    if (!rc) {
      throw new NotFoundError("Rapor tidak ditemukan");
    }
    if (rc.schoolId !== schoolId) {
      throw new ForbiddenError("Akses ditolak (Tenant Isolation)");
    }
    return rc;
  }

  private checkPublishedLock(status: "DRAFT" | "PUBLISHED", role: string) {
    if (status === "PUBLISHED" && role !== "SuperAdmin") {
      throw new ForbiddenError("Data rapor terkunci karena sudah dipublikasikan (hanya SuperAdmin yang dapat mengubah)");
    }
  }
}
