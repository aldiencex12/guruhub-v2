import { db } from "../../../db";
import { schools } from "../../../schema/schools";
import { students } from "../../../schema/students";
import { classes } from "../../../schema/classes";
import { academicYears } from "../../../schema/academicYears";
import { teachers } from "../../../schema/teachers";
import { subjects } from "../../../schema/subjects";
import { schedules } from "../../../schema/schedules";
import { attendances, attendanceDetails } from "../../../schema/attendances";
import { teachingJournals } from "../../../schema/teachingJournals";
import { assessments, assessmentScores } from "../../../schema/assessments";
import { classMembers } from "../../../schema/classMembers";
import { reportCards, reportCardSubjects, reportCardAttendances, studentExtracurriculars, studentAchievements, p5Projects, extracurriculars } from "../../../schema/reportCards";
import { disciplineSanctionLogs, disciplineIncidents, disciplineIncidentStudents, disciplineTypes } from "../../../schema/discipline";
import { eq, and, isNull, sql, asc, desc } from "drizzle-orm";
import puppeteer from "puppeteer";
import { interimReportCards, interimReportCardSubjects } from "../../../schema/interimReportCards";
import { InterimReportCardService } from "../../report-cards/service/interimReportCardService";
import {
  generateReportCardHtml,
  generateAttendanceReportHtml,
  generateTeachingJournalHtml,
  generateAssessmentReportHtml,
  generateStudentListHtml,
  generateTeacherListHtml,
  generateSanctionReportHtml,
  generateInterimReportCardHtml,
  generateClassInterimReportCardHtml
} from "../templates/pdfTemplates";

export class PdfGeneratorService {
  private formatSchoolData(school: any) {
    return {
      foundationName: school.foundationName || undefined,
      regionalName: school.regionalName || undefined,
      name: school.name,
      npsn: school.npsn,
      accreditation: school.accreditation || undefined,
      address: school.address || undefined,
      phone: school.phone || undefined,
      email: school.email || undefined,
      website: school.website || undefined,
      logoUrl: school.logoUrl || undefined,
      kopSuratUrl: school.kopSuratUrl || undefined,
      principalName: school.principalName || undefined,
      principalNip: school.principalNip || undefined,
    };
  }
  /**
   * Helper to run Puppeteer and return PDF Buffer
   */
  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-software-rasterizer"
      ],
      headless: true
    });
    let page: any = null;
    try {
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf({
        // Use CSS @page size (F4) and eliminate Chromium defaults
        preferCSSPageSize: true,
        width: '210mm',
        height: '330mm',
        scale: 1,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        tagged: false,
      });
      return Buffer.from(pdf);
    } finally {
      if (page) {
        try { await page.close(); } catch {}
      }
      try { await browser.close(); } catch {}
    }
  }

  /**
   * Get Teacher ID from User ID
   */
  private async getTeacherId(schoolId: number, userId: number): Promise<number | null> {
    const list = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.userId, userId), eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))
      .limit(1);
    return list[0]?.id || null;
  }

  /**
   * 1. Export PDF Rapor Siswa
   */
  async generateReportCardPdf(schoolId: number, reportCardId: number, userId: number, role: string): Promise<Buffer> {
    // 1. RBAC check: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // 2. Fetch report card
    const rc = await db
      .select()
      .from(reportCards)
      .where(and(eq(reportCards.id, reportCardId), isNull(reportCards.deletedAt)))
      .limit(1);

    const report = rc[0];
    if (!report) {
      throw new Error("404: Report card not found");
    }

    // 3. Tenant Isolation check
    if (report.schoolId !== schoolId) {
      throw new Error("403: Forbidden (Tenant mismatch)");
    }

    // 4. Fetch metadata & details in parallel
    const [schoolData, studentData, classData, ayData, subjectsData, attData, extData, achData, p5Data] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(students).where(eq(students.id, report.studentId)).limit(1),
      db.select().from(classes).where(eq(classes.id, report.classId)).limit(1),
      db.select().from(academicYears).where(eq(academicYears.id, report.academicYearId)).limit(1),
      db
        .select({
          name: subjects.name,
          finalScore: reportCardSubjects.finalScore,
          gradeLetter: reportCardSubjects.gradeLetter,
          knowledgeDescription: reportCardSubjects.knowledgeDescription
        })
        .from(reportCardSubjects)
        .innerJoin(subjects, eq(reportCardSubjects.subjectId, subjects.id))
        .where(eq(reportCardSubjects.reportCardId, reportCardId)),
      db.select().from(reportCardAttendances).where(eq(reportCardAttendances.reportCardId, reportCardId)).limit(1),
      db
        .select({
          name: extracurriculars.name,
          predicate: studentExtracurriculars.predicate,
          description: studentExtracurriculars.description
        })
        .from(studentExtracurriculars)
        .innerJoin(extracurriculars, eq(studentExtracurriculars.extracurricularId, extracurriculars.id))
        .where(eq(studentExtracurriculars.reportCardId, reportCardId)),
      db.select().from(studentAchievements).where(eq(studentAchievements.reportCardId, reportCardId)),
      db.select().from(p5Projects).where(eq(p5Projects.reportCardId, reportCardId))
    ]);

    const school = schoolData[0];
    const student = studentData[0];
    const cls = classData[0];
    const ay = ayData[0];

    if (!school || !student || !cls || !ay) {
      throw new Error("404: Metadata not found");
    }

    const html = generateReportCardHtml({
      school: this.formatSchoolData(school),
      student: {
        name: student.name,
        nis: student.nisn || "-",
        nisn: student.nisn || "-",
        className: cls.name
      },
      academicYear: {
        year: ay.year,
        semester: ay.semester
      },
      subjects: subjectsData.map((s) => ({
        name: s.name,
        finalScore: s.finalScore,
        gradeLetter: s.gradeLetter,
        knowledgeDescription: s.knowledgeDescription || ""
      })),
      attendance: {
        sick: attData[0]?.sick || 0,
        permission: attData[0]?.permission || 0,
        absent: attData[0]?.absent || 0
      },
      extracurriculars: extData.map((e) => ({
        name: e.name,
        predicate: e.predicate,
        description: e.description || ""
      })),
      achievements: achData.map((a) => ({
        title: a.title,
        level: a.level,
        description: a.description || ""
      })),
      p5: p5Data.map((p) => ({
        theme: p.theme,
        predicate: p.predicate,
        description: p.description || ""
      })),
      homeroomTeacherNotes: report.homeroomTeacherNotes || "",
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 2. Export PDF Rekap Absensi Kelas
   */
  async generateAttendancePdf(
    schoolId: number,
    classId: number,
    academicYearId: number,
    semester: string,
    userId: number,
    role: string
  ): Promise<Buffer> {
    // RBAC: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // Verify metadata
    const [schoolData, classData, ayData] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(classes).where(and(eq(classes.id, classId), isNull(classes.deletedAt))).limit(1),
      db.select().from(academicYears).where(eq(academicYears.id, academicYearId)).limit(1)
    ]);

    const school = schoolData[0];
    const cls = classData[0];
    const ay = ayData[0];

    if (!school || !cls || !ay) {
      throw new Error("404: Class or Academic Year not found");
    }

    // Tenant Isolation
    if (cls.schoolId !== schoolId || ay.schoolId !== schoolId) {
      throw new Error("403: Forbidden (Tenant mismatch)");
    }

    // Get active class members
    const activeMembers = await db
      .select({
        id: students.id,
        name: students.name
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE"),
          eq(classMembers.schoolId, schoolId),
          isNull(students.deletedAt)
        )
      )
      .orderBy(students.name);

    // Get attendance totals for these students in this semester/AY
    const attendanceStats = await db
      .select({
        studentId: attendanceDetails.studentId,
        status: attendanceDetails.status,
        count: sql<number>`count(*)`
      })
      .from(attendanceDetails)
      .innerJoin(attendances, eq(attendanceDetails.attendanceId, attendances.id))
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .where(
        and(
          eq(schedules.classId, classId),
          eq(schedules.academicYearId, academicYearId),
          eq(attendances.schoolId, schoolId),
          isNull(attendances.deletedAt),
          isNull(schedules.deletedAt)
        )
      )
      .groupBy(attendanceDetails.studentId, attendanceDetails.status);

    const statsMap: Record<number, { present: number; sick: number; permission: number; absent: number }> = {};
    for (const member of activeMembers) {
      statsMap[member.id] = { present: 0, sick: 0, permission: 0, absent: 0 };
    }

    for (const stat of attendanceStats) {
      const counts = statsMap[stat.studentId];
      if (counts) {
        const countVal = Number(stat.count);
        if (stat.status === "PRESENT") counts.present = countVal;
        else if (stat.status === "SICK") counts.sick = countVal;
        else if (stat.status === "PERMISSION") counts.permission = countVal;
        else if (stat.status === "ABSENT") counts.absent = countVal;
      }
    }

    const studentsReport = activeMembers.map((m) => ({
      name: m.name,
      present: statsMap[m.id]?.present || 0,
      sick: statsMap[m.id]?.sick || 0,
      permission: statsMap[m.id]?.permission || 0,
      absent: statsMap[m.id]?.absent || 0
    }));

    const html = generateAttendanceReportHtml({
      school: this.formatSchoolData(school),
      className: cls.name,
      academicYear: {
        year: ay.year,
        semester: semester
      },
      students: studentsReport,
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 3. Export PDF Jurnal Mengajar Guru
   */
  async generateTeachingJournalPdf(schoolId: number, teacherId: number, userId: number, role: string): Promise<Buffer> {
    // RBAC: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // Teacher can only view their own journal
    if (role === "Teacher" || role === "HomeroomTeacher") {
      const activeTeacherId = await this.getTeacherId(schoolId, userId);
      if (activeTeacherId !== teacherId) {
        throw new Error("403: Forbidden (Cannot access another teacher's journals)");
      }
    }

    // Fetch Teacher
    const teacherData = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.id, teacherId), isNull(teachers.deletedAt)))
      .limit(1);

    const teacher = teacherData[0];
    if (!teacher) {
      throw new Error("404: Teacher not found");
    }

    // Tenant Isolation
    if (teacher.schoolId !== schoolId) {
      throw new Error("403: Forbidden (Tenant mismatch)");
    }

    const [schoolData, journals] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db
        .select()
        .from(teachingJournals)
        .where(and(eq(teachingJournals.teacherId, teacherId), eq(teachingJournals.schoolId, schoolId), isNull(teachingJournals.deletedAt)))
        .orderBy(teachingJournals.journalDate)
    ]);

    const school = schoolData[0];
    if (!school) {
      throw new Error("404: School not found");
    }

    const html = generateTeachingJournalHtml({
      school: this.formatSchoolData(school),
      teacher: {
        name: teacher.name,
        nip: teacher.nip || "-"
      },
      journals: journals.map((j) => ({
        date: j.journalDate,
        topic: j.topic,
        objectives: j.learningObjectives,
        method: j.teachingMethod,
        reflection: j.reflection || ""
      })),
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 4. Export PDF Assessment Report
   */
  async generateAssessmentPdf(schoolId: number, assessmentId: number, userId: number, role: string): Promise<Buffer> {
    // RBAC: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // Fetch assessment
    const assess = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, assessmentId), isNull(assessments.deletedAt)))
      .limit(1);

    const assessment = assess[0];
    if (!assessment) {
      throw new Error("404: Assessment not found");
    }

    // Tenant Isolation
    if (assessment.schoolId !== schoolId) {
      throw new Error("403: Forbidden (Tenant mismatch)");
    }

    // Teacher can only view their own assessment
    if (role === "Teacher" || role === "HomeroomTeacher") {
      const activeTeacherId = await this.getTeacherId(schoolId, userId);
      if (activeTeacherId !== assessment.teacherId) {
        throw new Error("403: Forbidden (Cannot access another teacher's assessment)");
      }
    }

    // Fetch metadata
    const [schoolData, classData, subjectData, teacherData, scores] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(classes).where(eq(classes.id, assessment.classId)).limit(1),
      db.select().from(subjects).where(eq(subjects.id, assessment.subjectId)).limit(1),
      db.select().from(teachers).where(eq(teachers.id, assessment.teacherId)).limit(1),
      db
        .select({
          studentName: students.name,
          score: assessmentScores.score,
          notes: assessmentScores.notes
        })
        .from(assessmentScores)
        .innerJoin(students, eq(assessmentScores.studentId, students.id))
        .where(
          and(
            eq(assessmentScores.assessmentId, assessmentId),
            isNull(students.deletedAt)
          )
        )
        .orderBy(students.name)
    ]);

    const school = schoolData[0];
    const cls = classData[0];
    const subject = subjectData[0];
    const teacher = teacherData[0];

    if (!school || !cls || !subject || !teacher) {
      throw new Error("404: Metadata not found");
    }

    let sum = 0, max = 0, min = scores.length > 0 ? (scores[0]?.score || 0) : 0;
    for (const s of scores) {
      sum += s.score;
      if (s.score > max) max = s.score;
      if (s.score < min) min = s.score;
    }
    const average = scores.length > 0 ? Math.round((sum / scores.length) * 100) / 100 : 0;

    const html = generateAssessmentReportHtml({
      school: this.formatSchoolData(school),
      assessment: {
        title: assessment.title,
        type: assessment.assessmentType,
        date: assessment.assessmentDate,
        className: cls.name,
        subjectName: subject.name,
        teacherName: teacher.name
      },
      stats: { average, max, min },
      scores: scores.map((s) => ({
        studentName: s.studentName,
        score: s.score,
        notes: s.notes || ""
      })),
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 5. Export PDF Student List
   */
  async generateStudentListPdf(
    schoolId: number,
    classId: number,
    academicYearId: number,
    userId: number,
    role: string
  ): Promise<Buffer> {
    // RBAC: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // Verify metadata
    const [schoolData, classData, ayData] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(classes).where(and(eq(classes.id, classId), isNull(classes.deletedAt))).limit(1),
      db.select().from(academicYears).where(eq(academicYears.id, academicYearId)).limit(1)
    ]);

    const school = schoolData[0];
    const cls = classData[0];
    const ay = ayData[0];

    if (!school || !cls || !ay) {
      throw new Error("404: Class or Academic Year not found");
    }

    // Tenant Isolation
    if (cls.schoolId !== schoolId || ay.schoolId !== schoolId) {
      throw new Error("403: Forbidden (Tenant mismatch)");
    }

    // Get active students
    const activeStudents = await db
      .select({
        name: students.name,
        nisn: students.nisn,
        gender: students.gender
      })
      .from(classMembers)
      .innerJoin(students, eq(classMembers.studentId, students.id))
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE"),
          eq(classMembers.schoolId, schoolId),
          isNull(students.deletedAt)
        )
      )
      .orderBy(students.name);

    const formattedActiveStudents = activeStudents.map((s) => ({
      name: s.name,
      nis: s.nisn || "-",
      nisn: s.nisn || "-",
      gender: s.gender,
    }));

    const html = generateStudentListHtml({
      school: this.formatSchoolData(school),
      className: cls.name,
      academicYear: {
        year: ay.year,
        semester: ay.semester
      },
      students: formattedActiveStudents,
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 6. Export PDF Teacher List
   */
  async generateTeacherListPdf(schoolId: number, userId: number, role: string): Promise<Buffer> {
    // RBAC: Student is forbidden
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    // Fetch School
    const schoolData = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    const school = schoolData[0];
    if (!school) {
      throw new Error("404: School not found");
    }

    // Fetch teachers
    const activeTeachers = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        nip: teachers.nip,
        gender: teachers.gender
      })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))
      .orderBy(teachers.name);

    // Join with classes to see if they are a homeroom teacher
    const classList = await db
      .select({ homeroomTeacherId: classes.homeroomTeacherId, className: classes.name })
      .from(classes)
      .where(and(eq(classes.schoolId, schoolId), isNull(classes.deletedAt)));

    const homeroomMap: Record<number, string> = {};
    for (const c of classList) {
      if (c.homeroomTeacherId) {
        homeroomMap[c.homeroomTeacherId] = c.className;
      }
    }

    const teacherReport = activeTeachers.map((t) => ({
      name: t.name,
      nip: t.nip || "-",
      gender: t.gender,
      isHomeroom: homeroomMap[t.id] ? `Wali Kelas ${homeroomMap[t.id]}` : "-"
    }));

    const html = generateTeacherListHtml({
      school: this.formatSchoolData(school),
      teachers: teacherReport,
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 7. Export PDF Surat Peringatan (Sanction SP)
   */
  async generateSanctionPdf(schoolId: number, sanctionId: number, userId: number, role: string, docType?: string): Promise<Buffer> {
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    const sanctionData = await db.query.disciplineSanctionLogs.findFirst({
      where: and(eq(disciplineSanctionLogs.id, sanctionId), eq(disciplineSanctionLogs.schoolId, schoolId))
    });

    if (!sanctionData) {
      throw new Error("404: Sanction record not found");
    }

    const [schoolData, studentData] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(students).where(eq(students.id, sanctionData.studentId)).limit(1),
    ]);

    const school = schoolData[0];
    const student = studentData[0];

    if (!school || !student) {
      throw new Error("404: School or Student metadata not found");
    }

    const cm = await db.query.classMembers.findFirst({
      where: eq(classMembers.studentId, student.id)
    });
    let className = "-";
    if (cm) {
      const cls = await db.query.classes.findFirst({ where: eq(classes.id, cm.classId) });
      if (cls) className = cls.name;
    }

    // Fetch Incidents
    const studentIncidents = await db
      .select({
        id: disciplineIncidents.id,
        incidentDate: disciplineIncidents.incidentDate,
        location: disciplineIncidents.location,
        status: disciplineIncidents.status,
        demeritPoints: disciplineIncidentStudents.pointSnapshot,
        notes: disciplineIncidentStudents.notes,
        typeName: disciplineTypes.name,
        typeDescription: disciplineTypes.description
      })
      .from(disciplineIncidentStudents)
      .innerJoin(disciplineIncidents, eq(disciplineIncidents.id, disciplineIncidentStudents.incidentId))
      .innerJoin(disciplineTypes, eq(disciplineTypes.id, disciplineIncidentStudents.disciplineTypeId))
      .where(
        and(
          eq(disciplineIncidentStudents.studentId, student.id),
          eq(disciplineIncidentStudents.academicYearId, sanctionData.academicYearId),
          eq(disciplineIncidents.schoolId, schoolId)
        )
      )
      .orderBy(desc(disciplineIncidents.incidentDate));

    // Calculate sum for current academic year (matching sanction's year)
    let semesterPointsSum = 0;
    studentIncidents.forEach(inc => {
      semesterPointsSum += inc.demeritPoints || 0;
    });

    const ayData = await db.query.academicYears.findFirst({
      where: eq(academicYears.id, sanctionData.academicYearId)
    });
    const semesterName = ayData ? ayData.semester : "Ganjil";
    const academicYearName = ayData ? ayData.year : "2025/2026";

    const html = generateSanctionReportHtml({
      school: this.formatSchoolData(school),
      student: {
        name: student.name,
        nisn: student.nisn || "-",
        className,
        studentId: student.id
      },
      sanction: {
        id: sanctionData.id,
        sanctionType: sanctionData.sanctionType,
        cumulativePoints: sanctionData.cumulativePoints,
        issuedDate: new Date(sanctionData.createdAt || Date.now()).toLocaleDateString("id-ID"),
        notes: sanctionData.notes || undefined
      },
      incidents: studentIncidents,
      semesterPointsSum,
      semesterName,
      academicYearName,
      docType,
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 8. Export PDF Raport Sisipan Siswa
   */
  async generateInterimReportCardPdf(schoolId: number, interimReportCardId: number, userId: number, role: string): Promise<Buffer> {
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    const interimService = new InterimReportCardService();
    const details = await interimService.getInterimReportCardDetails(schoolId, interimReportCardId);

    const schoolData = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    const school = schoolData[0];
    if (!school) throw new Error("404: School metadata not found");

    // Determine student's class roll number (No. Absen) — ordered by studentId within the class
    let studentNo: number | undefined;
    try {
      const classRoll = await db
        .select({ studentId: classMembers.studentId })
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, details.classId),
            eq(classMembers.academicYearId, details.academicYearId),
            eq(classMembers.status, "ACTIVE")
          )
        )
        .orderBy(asc(classMembers.studentId));
      const rollIndex = classRoll.findIndex(r => r.studentId === details.studentId);
      if (rollIndex !== -1) studentNo = rollIndex + 1;
    } catch {}

    const html = generateInterimReportCardHtml({
      school: this.formatSchoolData(school),
      student: {
        name: details.student?.name || "-",
        nisn: details.student?.nisn || "-",
        className: details.class?.name || "-",
        religion: details.student?.religion || "Islam",
        studentNo
      },
      academicYear: {
        year: details.academicYear?.year || "-",
        semester: details.semester
      },
      subjects: details.subjects.map((s: any) => ({
        name: s.subject?.name || "-",
        tugas1: s.tugas1,
        tugas2: s.tugas2,
        sts: s.sts,
        finalScore: s.finalScore,
        gradeLetter: s.gradeLetter || "-",
        notes: s.notes || ""
      })),
      attendance: {
        sick: details.sick || 0,
        permission: details.permission || 0,
        absent: details.absent || 0
      },
      homeroomTeacherNotes: details.homeroomTeacherNotes || "",
      homeroomTeacherName: details.class?.homeroomTeacher?.name,
      printDate: new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    });

    return this.renderHtmlToPdf(html);
  }

  /**
   * 9. Export PDF Massal Raport Sisipan per Kelas
   */
  async generateClassInterimReportCardPdf(
    schoolId: number,
    classId: number,
    academicYearId: number,
    semester: "GANJIL" | "GENAP",
    userId: number,
    role: string
  ): Promise<Buffer> {
    if (role === "Student") {
      throw new Error("403: Forbidden");
    }

    const interimService = new InterimReportCardService();
    const reports = await interimService.getClassInterimReportCards(schoolId, classId, academicYearId, semester);
    if (reports.length === 0) {
      throw new Error("404: Tidak ada data Raport Sisipan untuk kelas ini");
    }

    const schoolData = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    const school = schoolData[0];
    if (!school) throw new Error("404: School metadata not found");

    // Ambil nomor absen kelas
    const classRoll = await db
      .select({ studentId: classMembers.studentId })
      .from(classMembers)
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.academicYearId, academicYearId),
          eq(classMembers.status, "ACTIVE")
        )
      )
      .orderBy(asc(classMembers.studentId));

    const rollMap = new Map<number, number>();
    classRoll.forEach((r, idx) => rollMap.set(r.studentId, idx + 1));

    // Urutkan siswa berdasarkan nama
    reports.sort((a, b) => (a.student?.name || "").localeCompare(b.student?.name || ""));

    const printDate = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    const formattedSchool = this.formatSchoolData(school);

    const reportsData = reports.map((details) => {
      const studentNo = rollMap.get(details.studentId);
      return {
        school: formattedSchool,
        student: {
          name: details.student?.name || "-",
          nisn: details.student?.nisn || "-",
          className: details.class?.name || "-",
          religion: details.student?.religion || "Islam",
          studentNo
        },
        academicYear: {
          year: details.academicYear?.year || "-",
          semester: details.semester
        },
        subjects: (details.subjects || []).map((s: any) => ({
          name: s.subject?.name || "-",
          tugas1: s.tugas1,
          tugas2: s.tugas2,
          sts: s.sts,
          finalScore: s.finalScore,
          gradeLetter: s.gradeLetter || "-",
          notes: s.notes || ""
        })),
        attendance: {
          sick: details.sick || 0,
          permission: details.permission || 0,
          absent: details.absent || 0
        },
        homeroomTeacherNotes: details.homeroomTeacherNotes || "",
        homeroomTeacherName: details.class?.homeroomTeacher?.name,
        printDate
      };
    });

    const combinedHtml = generateClassInterimReportCardHtml(reportsData);
    return this.renderHtmlToPdf(combinedHtml);
  }
}

