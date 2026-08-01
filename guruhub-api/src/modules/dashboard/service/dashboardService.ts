import { db } from "../../../db";
import { students } from "../../../schema/students";
import { teachers } from "../../../schema/teachers";
import { classes } from "../../../schema/classes";
import { subjects } from "../../../schema/subjects";
import { schedules } from "../../../schema/schedules";
import { attendances, attendanceDetails } from "../../../schema/attendances";
import { teachingJournals } from "../../../schema/teachingJournals";
import { assessments } from "../../../schema/assessments";
import { studentFinalGrades } from "../../../schema/studentFinalGrades";
import { reportCards } from "../../../schema/reportCards";
import { classMembers } from "../../../schema/classMembers";
import { academicYears } from "../../../schema/academicYears";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";

export class DashboardService {
  /**
   * Mengambil profil teacherId dari userId
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
   * 1. School Summary
   */
  async getSchoolSummary(schoolId: number, userId: number, role: string) {
    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalSubjects: 0, totalSchedules: 0 };
      }

      // Ambil schedule untuk guru ini
      const teacherSchedules = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.teacherId, teacherId), eq(schedules.schoolId, schoolId), isNull(schedules.deletedAt)));

      const classIds = Array.from(new Set(teacherSchedules.map((s) => s.classId)));
      const subjectIds = Array.from(new Set(teacherSchedules.map((s) => s.subjectId)));

      let studentCount = 0;
      if (classIds.length > 0) {
        const studentRes = await db
          .select({ count: sql<number>`count(distinct ${classMembers.studentId})` })
          .from(classMembers)
          .where(and(inArray(classMembers.classId, classIds), eq(classMembers.status, "ACTIVE"), eq(classMembers.schoolId, schoolId)));
        studentCount = Number(studentRes[0]?.count || 0);
      }

      const activeYear = await db.select().from(academicYears).where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true))).limit(1);

      return {
        totalStudents: studentCount,
        totalTeachers: 1,
        totalClasses: classIds.length,
        totalSubjects: subjectIds.length,
        totalSchedules: teacherSchedules.length,
        activeAcademicYear: activeYear[0] ? { name: activeYear[0].year, semester: activeYear[0].semester } : null,
        serverTime: new Date().toISOString(),
      };
    }

    // Role Admin / Principal / SuperAdmin
    const [stud, teach, cls, subj, sched] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.schoolId, schoolId), isNull(students.deletedAt), eq(students.status, "Aktif"))),
      db.select({ count: sql<number>`count(*)` }).from(teachers).where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(classes).where(and(eq(classes.schoolId, schoolId), isNull(classes.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(subjects).where(and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(schedules).where(and(eq(schedules.schoolId, schoolId), isNull(schedules.deletedAt))),
    ]);

    const activeYear = await db.select().from(academicYears).where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true))).limit(1);

    return {
      totalStudents: Number(stud[0]?.count || 0),
      totalTeachers: Number(teach[0]?.count || 0),
      totalClasses: Number(cls[0]?.count || 0),
      totalSubjects: Number(subj[0]?.count || 0),
      totalSchedules: Number(sched[0]?.count || 0),
      activeAcademicYear: activeYear[0] ? { name: activeYear[0].year, semester: activeYear[0].semester } : null,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * 2. Attendance Summary (Hari Ini)
   */
  async getAttendanceSummary(schoolId: number, userId: number, role: string) {
    const todayStr = new Date().toISOString().split("T")[0];

    const baseQuery = db
      .select({
        status: attendanceDetails.status,
        count: sql<number>`count(*)`
      })
      .from(attendanceDetails)
      .innerJoin(attendances, eq(attendanceDetails.attendanceId, attendances.id));

    let conditions = [
      sql`${attendances.attendanceDate} = ${todayStr}`,
      sql`${attendances.schoolId} = ${schoolId}`,
      isNull(attendances.deletedAt)
    ];

    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { hadirHariIni: 0, sakitHariIni: 0, izinHariIni: 0, alfaHariIni: 0 };
      }
      conditions.push(sql`${attendances.teacherId} = ${teacherId}`);
    }

    const rows = await baseQuery.where(and(...conditions)).groupBy(attendanceDetails.status);

    let hadir = 0, sakit = 0, izin = 0, alfa = 0;
    for (const r of rows) {
      if (r.status === "PRESENT") hadir = Number(r.count);
      else if (r.status === "SICK") sakit = Number(r.count);
      else if (r.status === "PERMISSION") izin = Number(r.count);
      else if (r.status === "ABSENT") alfa = Number(r.count);
    }

    return {
      hadirHariIni: hadir,
      sakitHariIni: sakit,
      izinHariIni: izin,
      alfaHariIni: alfa,
    };
  }

  /**
   * 3. Teaching Journal Summary (Hari Ini)
   */
  async getTeachingJournalSummary(schoolId: number, userId: number, role: string) {
    const todayStr = new Date().toISOString().split("T")[0];
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDay = days[new Date().getDay()];

    // 1. Jurnal hari ini yang sudah terisi
    let journalCond = [
      sql`${teachingJournals.journalDate} = ${todayStr}`,
      eq(teachingJournals.schoolId, schoolId),
      isNull(teachingJournals.deletedAt)
    ];

    // 2. Schedule hari ini
    let schedCond = [
      sql`${schedules.dayOfWeek} = ${todayDay}`,
      eq(schedules.status, "Aktif"),
      eq(schedules.schoolId, schoolId),
      isNull(schedules.deletedAt)
    ];

    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { jurnalHariIni: 0, guruSudahMengisi: 0, guruBelumMengisi: 0 };
      }
      journalCond.push(eq(teachingJournals.teacherId, teacherId));
      schedCond.push(eq(schedules.teacherId, teacherId));
    }

    // Ambil jurnal terisi
    const journals = await db
      .select({ teacherId: teachingJournals.teacherId })
      .from(teachingJournals)
      .where(and(...journalCond));

    const teachersFilled = Array.from(new Set(journals.map((j) => j.teacherId)));

    // Ambil schedules hari ini
    const todaySchedules = await db
      .select({ teacherId: schedules.teacherId })
      .from(schedules)
      .where(and(...schedCond));

    const teachersScheduled = Array.from(new Set(todaySchedules.map((s) => s.teacherId)));

    const alreadyFilledSet = new Set(teachersFilled);
    const notFilled = teachersScheduled.filter((t) => !alreadyFilledSet.has(t));

    return {
      jurnalHariIni: journals.length,
      guruSudahMengisi: teachersFilled.length,
      guruBelumMengisi: notFilled.length,
    };
  }

  /**
   * 4. Assessment Summary
   */
  async getAssessmentSummary(schoolId: number, userId: number, role: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startOfWeek = weekAgo.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    let conditions = [
      eq(assessments.schoolId, schoolId),
      isNull(assessments.deletedAt)
    ];

    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { totalAssessment: 0, assessmentBulanIni: 0, assessmentMingguIni: 0 };
      }
      conditions.push(eq(assessments.teacherId, teacherId));
    }

    const [totalRes, monthRes, weekRes] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(assessments).where(and(...conditions)),
      db.select({ count: sql<number>`count(*)` }).from(assessments).where(and(...conditions, sql`${assessments.assessmentDate} >= ${startOfMonth}`, sql`${assessments.assessmentDate} <= ${endOfMonth}`)),
      db.select({ count: sql<number>`count(*)` }).from(assessments).where(and(...conditions, sql`${assessments.assessmentDate} >= ${startOfWeek}`, sql`${assessments.assessmentDate} <= ${todayStr}`)),
    ]);

    return {
      totalAssessment: Number(totalRes[0]?.count || 0),
      assessmentBulanIni: Number(monthRes[0]?.count || 0),
      assessmentMingguIni: Number(weekRes[0]?.count || 0),
    };
  }

  /**
   * 5. Grade Summary
   */
  async getGradeSummary(schoolId: number, userId: number, role: string) {
    let baseGradeQuery = db
      .select({ score: studentFinalGrades.finalScore })
      .from(studentFinalGrades);

    let conditions = [
      eq(studentFinalGrades.schoolId, schoolId)
    ];

    let classIds: number[] = [];

    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { rataRataSekolah: 0, rataRataPerKelas: [], rataRataPerMapel: [] };
      }
      // Guru hanya bisa melihat kelas/mapel yang dia ajar
      const teacherSchedules = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.teacherId, teacherId), eq(schedules.schoolId, schoolId), isNull(schedules.deletedAt)));

      classIds = Array.from(new Set(teacherSchedules.map((s) => s.classId)));
      const subjectIds = Array.from(new Set(teacherSchedules.map((s) => s.subjectId)));

      if (classIds.length === 0 || subjectIds.length === 0) {
        return { rataRataSekolah: 0, rataRataPerKelas: [], rataRataPerMapel: [] };
      }

      conditions.push(inArray(studentFinalGrades.classId, classIds));
      conditions.push(inArray(studentFinalGrades.subjectId, subjectIds));
    }

    // 1. Rata-rata sekolah (atau rata-rata guru)
    const schoolAvgRes = await baseGradeQuery.where(and(...conditions));
    let totalScoreSum = 0;
    for (const r of schoolAvgRes) totalScoreSum += r.score;
    const rataRataSekolah = schoolAvgRes.length > 0 ? Math.round((totalScoreSum / schoolAvgRes.length) * 100) / 100 : 0;

    // 2. Rata-rata per kelas
    const classAvgRes = await db
      .select({
        classId: studentFinalGrades.classId,
        className: classes.name,
        averageScore: sql<number>`avg(${studentFinalGrades.finalScore})`
      })
      .from(studentFinalGrades)
      .innerJoin(classes, eq(studentFinalGrades.classId, classes.id))
      .where(and(...conditions))
      .groupBy(studentFinalGrades.classId, classes.name);

    const rataRataPerKelas = classAvgRes.map((c) => ({
      classId: c.classId,
      className: c.className,
      averageScore: Math.round(Number(c.averageScore) * 100) / 100,
    }));

    // 3. Rata-rata per mapel
    const subjectAvgRes = await db
      .select({
        subjectId: studentFinalGrades.subjectId,
        subjectName: subjects.name,
        averageScore: sql<number>`avg(${studentFinalGrades.finalScore})`
      })
      .from(studentFinalGrades)
      .innerJoin(subjects, eq(studentFinalGrades.subjectId, subjects.id))
      .where(and(...conditions))
      .groupBy(studentFinalGrades.subjectId, subjects.name);

    const rataRataPerMapel = subjectAvgRes.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      averageScore: Math.round(Number(s.averageScore) * 100) / 100,
    }));

    return {
      rataRataSekolah,
      rataRataPerKelas,
      rataRataPerMapel,
    };
  }

  /**
   * 6. Report Card Summary
   */
  async getReportCardSummary(schoolId: number, userId: number, role: string) {
    let conditions = [
      eq(reportCards.schoolId, schoolId),
      isNull(reportCards.deletedAt)
    ];

    if (role === "Teacher" || role === "HomeroomTeacher") {
      const teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { totalDraft: 0, totalPublished: 0 };
      }

      // Ambil kelas yang diajar guru
      const teacherSchedules = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.teacherId, teacherId), eq(schedules.schoolId, schoolId), isNull(schedules.deletedAt)));

      const classIds = Array.from(new Set(teacherSchedules.map((s) => s.classId)));
      if (classIds.length === 0) {
        return { totalDraft: 0, totalPublished: 0 };
      }
      conditions.push(inArray(reportCards.classId, classIds));
    }

    const rows = await db
      .select({
        status: reportCards.status,
        count: sql<number>`count(*)`
      })
      .from(reportCards)
      .where(and(...conditions))
      .groupBy(reportCards.status);

    let draftCount = 0;
    let publishedCount = 0;

    for (const r of rows) {
      if (r.status === "DRAFT") draftCount = Number(r.count);
      else if (r.status === "PUBLISHED") publishedCount = Number(r.count);
    }

    return {
      totalDraft: draftCount,
      totalPublished: publishedCount,
    };
  }

  /**
   * 7. Get Academic Years
   */
  async getAcademicYears(schoolId: number) {
    return await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.schoolId, schoolId));
  }

  /**
   * 8. Get Pending Tasks (Absensi/Jurnal)
   */
  async getPendingTasks(schoolId: number, userId: number, role: string) {
    if (role !== "Teacher" && role !== "HomeroomTeacher") {
      return [];
    }

    const teacherId = await this.getTeacherId(schoolId, userId);
    if (!teacherId) return [];

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;
    
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDay = days[now.getDay()];
    
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}:00`;

    // Get today's schedules for this teacher
    const todaySchedules = await db
      .select({
        id: schedules.id,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(schedules)
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
      .where(
        and(
          eq(schedules.teacherId, teacherId),
          eq(schedules.schoolId, schoolId),
          eq(schedules.dayOfWeek, todayDay),
          eq(schedules.status, "Aktif"),
          isNull(schedules.deletedAt)
        )
      );

    if (todaySchedules.length === 0) return [];

    // Filter schedules that have already finished
    const finishedSchedules = todaySchedules.filter((s) => s.endTime < currentTimeStr);
    
    if (finishedSchedules.length === 0) return [];

    const scheduleIds = finishedSchedules.map((s) => s.id);

    // Find attendances for today
    const attendanceRecords = await db
      .select({ scheduleId: attendances.scheduleId })
      .from(attendances)
      .where(
        and(
          eq(attendances.schoolId, schoolId),
          eq(attendances.attendanceDate, todayStr),
          inArray(attendances.scheduleId, scheduleIds),
          isNull(attendances.deletedAt)
        )
      );
    const attendedScheduleIds = new Set(attendanceRecords.map(a => a.scheduleId));

    // Find journals for today
    const journalRecords = await db
      .select({ scheduleId: teachingJournals.scheduleId })
      .from(teachingJournals)
      .where(
        and(
          eq(teachingJournals.schoolId, schoolId),
          eq(teachingJournals.journalDate, todayStr),
          inArray(teachingJournals.scheduleId, scheduleIds),
          isNull(teachingJournals.deletedAt)
        )
      );
    const journaledScheduleIds = new Set(journalRecords.map(j => j.scheduleId));

    const pendingTasks: Array<{ type: string, scheduleId: number, subjectName: string, className: string, time: string }> = [];

    for (const schedule of finishedSchedules) {
      const timeStr = `${schedule.startTime.substring(0, 5)} - ${schedule.endTime.substring(0, 5)}`;
      if (!attendedScheduleIds.has(schedule.id)) {
        pendingTasks.push({
          type: "ATTENDANCE",
          scheduleId: schedule.id,
          subjectName: schedule.subjectName,
          className: schedule.className,
          time: timeStr
        });
      }
      if (!journaledScheduleIds.has(schedule.id)) {
        pendingTasks.push({
          type: "JOURNAL",
          scheduleId: schedule.id,
          subjectName: schedule.subjectName,
          className: schedule.className,
          time: timeStr
        });
      }
    }

    return pendingTasks;
  }

  /**
   * 9. Get Student Highlights
   */
  async getStudentHighlights(schoolId: number, userId: number, role: string) {
    // Cari academic year yang aktif
    const activeYear = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
      .limit(1);

    const activeYearId = activeYear[0]?.id;
    if (!activeYearId) {
      return { topStudents: [], attentionStudents: [] };
    }

    let isTeacher = role === "Teacher" || role === "HomeroomTeacher";
    let teacherId = null;
    let classIds: number[] = [];
    let subjectIds: number[] = [];

    if (isTeacher) {
      teacherId = await this.getTeacherId(schoolId, userId);
      if (!teacherId) {
        return { topStudents: [], attentionStudents: [] };
      }

      const teacherSchedules = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.teacherId, teacherId), eq(schedules.schoolId, schoolId), isNull(schedules.deletedAt)));

      classIds = Array.from(new Set(teacherSchedules.map((s) => s.classId)));
      subjectIds = Array.from(new Set(teacherSchedules.map((s) => s.subjectId)));

      if (classIds.length === 0) {
        return { topStudents: [], attentionStudents: [] };
      }
    }

    // --- TOP STUDENTS ---
    let gradeConds = [
      eq(studentFinalGrades.schoolId, schoolId),
      eq(studentFinalGrades.academicYearId, activeYearId)
    ];

    if (isTeacher && classIds.length > 0 && subjectIds.length > 0) {
      gradeConds.push(inArray(studentFinalGrades.classId, classIds));
      gradeConds.push(inArray(studentFinalGrades.subjectId, subjectIds));
    }

    const topStudentsRes = await db
      .select({
        studentId: studentFinalGrades.studentId,
        studentName: students.name,
        className: classes.name,
        averageScore: sql<number>`avg(${studentFinalGrades.finalScore})`
      })
      .from(studentFinalGrades)
      .innerJoin(students, eq(studentFinalGrades.studentId, students.id))
      .innerJoin(classes, eq(studentFinalGrades.classId, classes.id))
      .where(and(...gradeConds, isNull(students.deletedAt), eq(students.status, "Aktif")))
      .groupBy(studentFinalGrades.studentId, students.name, classes.name)
      .orderBy(sql`avg(${studentFinalGrades.finalScore}) desc`)
      .limit(3);

    const topStudents = topStudentsRes.map(s => ({
      name: s.studentName,
      class: s.className,
      score: Math.round(Number(s.averageScore) * 100) / 100
    }));

    // --- ATTENTION STUDENTS ---
    let attendanceConds = [
      eq(attendances.schoolId, schoolId),
      isNull(attendances.deletedAt),
      eq(attendanceDetails.status, "ABSENT")
    ];

    // Jika ingin difilter berdasarkan absensi di kelas yang diajar guru tsb
    if (isTeacher && teacherId) {
      attendanceConds.push(eq(attendances.teacherId, teacherId));
    }
    // Jika tidak, bisa kita filter berdasarkan classIds saja atau seluruh sekolah.
    // Di sini kita filter dari attendance.teacherId = teacherId sesuai dengan konteks absensi guru tersebut

    const attentionRes = await db
      .select({
        studentId: attendanceDetails.studentId,
        studentName: students.name,
        // Karena attendances connect ke schedule, lalu ke class
        className: classes.name,
        alfas: sql<number>`count(*)`
      })
      .from(attendanceDetails)
      .innerJoin(attendances, eq(attendanceDetails.attendanceId, attendances.id))
      .innerJoin(students, eq(attendanceDetails.studentId, students.id))
      .innerJoin(schedules, eq(attendances.scheduleId, schedules.id))
      .innerJoin(classes, eq(schedules.classId, classes.id))
      .where(and(...attendanceConds, isNull(students.deletedAt), eq(students.status, "Aktif")))
      .groupBy(attendanceDetails.studentId, students.name, classes.name)
      .orderBy(sql`count(*) desc`)
      .limit(3);

    const attentionStudents = attentionRes.map(s => ({
      name: s.studentName,
      class: s.className,
      alfas: Number(s.alfas)
    }));

    return {
      topStudents,
      attentionStudents
    };
  }
}
