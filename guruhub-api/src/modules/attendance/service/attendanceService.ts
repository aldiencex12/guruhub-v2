import { AttendanceRepository } from "../repository/attendanceRepository";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "../../../errors/customErrors";
import { classes } from "../../../schema/classes";
import { db } from "../../../db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getTeacherIdFromUserId, type UserContext } from "../../../utils/rbac";
import { disciplineIncidents, disciplineIncidentStudents, disciplineTypes, disciplineCategories } from "../../../schema/discipline";
import { subjects } from "../../../schema/subjects";
import { schedules } from "../../../schema/schedules";
import { academicYears } from "../../../schema/academicYears";
import { DisciplineService } from "../../discipline/service/disciplineService";

export class AttendanceService {
  private repository = new AttendanceRepository();
  private disciplineService = new DisciplineService();

  private async validateTeacherPermission(schoolId: number, user: UserContext, scheduleTeacherId: number) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const teacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (teacherId !== scheduleTeacherId) {
        throw new ForbiddenError("Anda hanya diperbolehkan mengelola absensi untuk jadwal mengajar Anda sendiri");
      }
      return teacherId;
    }
    return scheduleTeacherId;
  }

  async createAttendance(
    schoolId: number,
    user: UserContext,
    payload: {
      scheduleId: number;
      attendanceDate: string;
      notes?: string;
      details: { studentId: number; status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"; notes?: string }[];
    }
  ) {
    // 1. Validasi schedule
    const schedule = await this.repository.findScheduleById(schoolId, payload.scheduleId);
    if (!schedule) {
      throw new BadRequestError("Jadwal pelajaran tidak ditemukan di sekolah ini");
    }

    // 2. Validasi Hak Akses Guru (hanya boleh mengisi jadwal miliknya)
    await this.validateTeacherPermission(schoolId, user, schedule.teacherId);

    // 3. Cegah absensi ganda (scheduleId + attendanceDate)
    const existing = await this.repository.findAttendanceByScheduleAndDate(schoolId, payload.scheduleId, payload.attendanceDate);
    if (existing) {
      throw new ConflictError("Absensi untuk jadwal pelajaran pada tanggal ini sudah dibuat");
    }

    // 4. Ambil daftar siswa aktif di kelas
    const classStudents = await this.repository.findClassStudents(schoolId, schedule.classId);
    const activeStudentIds = new Set(classStudents.map((s) => s.id));

    // 5. Validasi siswa yang diinput
    for (const d of payload.details) {
      if (!activeStudentIds.has(d.studentId)) {
        throw new BadRequestError(`Siswa dengan ID ${d.studentId} tidak aktif atau tidak terdaftar di kelas untuk jadwal ini`);
      }
    }

    // 6. Buat absensi
    try {
      const attendance = await this.repository.createAttendance(
        schoolId,
        schedule.teacherId, // Gunakan teacherId dari jadwal
        payload.scheduleId,
        payload.attendanceDate,
        payload.notes,
        payload.details
      );

      const details = await this.repository.findAttendanceDetails(attendance.id);
      
      // Auto-assign demerit points for ABSENT (Alpha) status
      await this.handleAlphaDemeritPoints(schoolId, schedule.classId, payload.attendanceDate, payload.details, user.id);

      return {
        ...attendance,
        details,
      };
    } catch (error: any) {
      console.error("[CRITICAL ERROR IN createAttendance]:", error);
      console.error("Payload details:", payload.details);
      throw error;
    }
  }

  async saveClassDailyAttendance(
    schoolId: number,
    user: UserContext,
    payload: {
      classId: number;
      attendanceDate: string;
      notes?: string;
      details: { studentId: number; status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"; notes?: string }[];
    }
  ) {
    // 1. Ambil daftar jadwal untuk kelas ini
    let classSchedules = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.schoolId, schoolId), eq(schedules.classId, payload.classId), isNull(schedules.deletedAt)));

    // Jika belum ada jadwal sama sekali untuk kelas ini, buat jadwal default presensi harian BK
    if (classSchedules.length === 0) {
      const teacherId = (await getTeacherIdFromUserId(schoolId, user.id)) || 1;
      const firstSubject = await db.query.subjects.findFirst({
        where: and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt))
      });

      if (!firstSubject) {
        throw new BadRequestError("Mata pelajaran belum dikonfigurasi di sekolah ini");
      }

      const activeAY = await db.query.academicYears.findFirst({
        where: eq(academicYears.schoolId, schoolId)
      });
      const academicYearId = activeAY?.id || 1;

      const [newSched] = await db.insert(schedules).values({
        schoolId,
        classId: payload.classId,
        subjectId: firstSubject.id,
        teacherId,
        academicYearId,
        dayOfWeek: "Senin",
        startTime: "07:00:00",
        endTime: "15:00:00",
      });

      const schedRecord = await this.repository.findScheduleById(schoolId, newSched.insertId);
      if (schedRecord) {
        classSchedules = [schedRecord];
      }
    }

    const targetSchedule = classSchedules[0];
    if (!targetSchedule) {
      throw new BadRequestError("Gagal menentukan jadwal presensi kelas");
    }

    const existing = await this.repository.findAttendanceByScheduleAndDate(
      schoolId,
      targetSchedule.id,
      payload.attendanceDate
    );

    let resultAttendance;
    if (existing) {
      resultAttendance = await this.repository.updateAttendance(
        schoolId,
        existing.id,
        payload.notes || "Presensi Harian BK",
        payload.details
      );
    } else {
      resultAttendance = await this.repository.createAttendance(
        schoolId,
        targetSchedule.teacherId,
        targetSchedule.id,
        payload.attendanceDate,
        payload.notes || "Presensi Harian BK",
        payload.details
      );
    }

    await this.handleAlphaDemeritPoints(
      schoolId,
      payload.classId,
      payload.attendanceDate,
      payload.details,
      user.id
    );

    return resultAttendance;
  }

  async getAttendanceById(schoolId: number, user: UserContext, id: number) {
    const attendance = await this.repository.findAttendanceById(schoolId, id);
    if (!attendance) {
      throw new NotFoundError("Data absensi tidak ditemukan");
    }

    const details = await this.repository.findAttendanceDetails(id);
    return {
      ...attendance,
      details,
    };
  }

  async updateAttendance(
    schoolId: number,
    user: UserContext,
    id: number,
    payload: {
      notes?: string;
      details?: { studentId: number; status: "PRESENT" | "SICK" | "PERMISSION" | "ABSENT"; notes?: string }[];
    }
  ) {
    // 1. Pastikan absensi ada
    const attendance = await this.repository.findAttendanceById(schoolId, id);
    if (!attendance) {
      throw new NotFoundError("Data absensi tidak ditemukan");
    }

    // 2. Ambil schedule
    const schedule = await this.repository.findScheduleById(schoolId, attendance.scheduleId);
    if (!schedule) {
      throw new BadRequestError("Jadwal pelajaran terkait absensi ini tidak ditemukan");
    }

    // 3. Validasi Hak Akses Guru
    await this.validateTeacherPermission(schoolId, user, schedule.teacherId);

    // 4. Validasi siswa yang diupdate jika ada
    if (payload.details && payload.details.length > 0) {
      const classStudents = await this.repository.findClassStudents(schoolId, schedule.classId);
      const activeStudentIds = new Set(classStudents.map((s) => s.id));

      for (const d of payload.details) {
        if (!activeStudentIds.has(d.studentId)) {
          throw new BadRequestError(`Siswa dengan ID ${d.studentId} tidak aktif atau tidak terdaftar di kelas untuk jadwal ini`);
        }
      }
    }

    const updated = await this.repository.updateAttendance(schoolId, id, payload.notes, payload.details);
    const details = await this.repository.findAttendanceDetails(id);

    if (payload.details && payload.details.length > 0) {
      await this.handleAlphaDemeritPoints(schoolId, schedule.classId, attendance.attendanceDate, payload.details, user.id);
    }

    return {
      ...updated,
      details,
    };
  }

  async deleteAttendance(schoolId: number, user: UserContext, id: number) {
    // 1. Pastikan absensi ada
    const attendance = await this.repository.findAttendanceById(schoolId, id);
    if (!attendance) {
      throw new NotFoundError("Data absensi tidak ditemukan");
    }

    // 2. Ambil schedule
    const schedule = await this.repository.findScheduleById(schoolId, attendance.scheduleId);
    if (!schedule) {
      throw new BadRequestError("Jadwal pelajaran terkait absensi ini tidak ditemukan");
    }

    // 3. Validasi Hak Akses Guru
    await this.validateTeacherPermission(schoolId, user, schedule.teacherId);

    // 4. Batalkan poin pelanggaran Alpha yang sudah tercatat jika absensi ini dihapus
    const details = await this.repository.findAttendanceDetails(id);
    if (details && details.length > 0) {
      const nonAbsentDetails = details.map(d => ({ studentId: d.studentId, status: "PRESENT" }));
      await this.handleAlphaDemeritPoints(schoolId, schedule.classId, attendance.attendanceDate, nonAbsentDetails, user.id);
    }

    // 5. Hard delete agar absensi bisa dibuat ulang di tanggal yang sama
    await this.repository.hardDeleteAttendance(schoolId, id);
  }

  async getAllAttendances(
    schoolId: number,
    user: UserContext,
    filters: { classId?: number; teacherId?: number; date?: string; allowedHomeroomClassIds?: number[] }
  ) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      filters.teacherId = myTeacherId;

      if (user.role === "HomeroomTeacher") {
        const homeroomClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.homeroomTeacherId, myTeacherId));
        filters.allowedHomeroomClassIds = homeroomClasses.map(c => c.id);
      }
    }
    return await this.repository.findAllAttendances(schoolId, filters);
  }

  async getAttendanceRecap(schoolId: number, user: UserContext, classId: number, month: string) {
    const rawData = await this.repository.getMonthlyRecapData(schoolId, classId, month);
    if (!rawData) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }

    const { class: cls, students: classStudents, attendances: monthlyAttendances, details } = rawData;

    // Create a map of attendanceId -> attendanceDate & subjectName
    const attendanceMap = new Map<number, { date: string; subject: string }>();
    monthlyAttendances.forEach(a => {
      attendanceMap.set(a.id, { date: a.attendanceDate, subject: a.subjectName });
    });

    // Group details by studentId and date
    const studentDailyStatuses = new Map<number, Map<string, string[]>>();
    
    details.forEach(d => {
      const attInfo = attendanceMap.get(d.attendanceId);
      if (!attInfo) return;

      const dateStr = attInfo.date;
      if (!studentDailyStatuses.has(d.studentId)) {
        studentDailyStatuses.set(d.studentId, new Map());
      }
      const dateMap = studentDailyStatuses.get(d.studentId)!;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, []);
      }
      dateMap.get(dateStr)!.push(d.status);
    });

    const formattedStudents = classStudents.map(student => {
      const dailyStatus: Record<string, string> = {};
      const dateMap = studentDailyStatuses.get(student.studentId);

      const summary = {
        PRESENT: 0,
        SICK: 0,
        PERMISSION: 0,
        ABSENT: 0,
      };

      if (dateMap) {
        dateMap.forEach((statuses, dateStr) => {
          let consolidatedStatus = "PRESENT";
          if (statuses.includes("ABSENT")) {
            consolidatedStatus = "ABSENT";
          } else if (statuses.includes("SICK")) {
            consolidatedStatus = "SICK";
          } else if (statuses.includes("PERMISSION")) {
            consolidatedStatus = "PERMISSION";
          }
          dailyStatus[dateStr] = consolidatedStatus;
          summary[consolidatedStatus as keyof typeof summary]++;
        });
      }

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        nisn: student.nisn,
        dailyStatus,
        summary,
      };
    });

    const uniqueDates = Array.from(new Set(monthlyAttendances.map(a => a.attendanceDate))).sort();

    return {
      class: {
        id: cls?.id || classId,
        name: cls?.name || "Kelas",
      },
      month,
      dates: uniqueDates,
      students: formattedStudents,
    };
  }

  async getSemesterAttendanceRecap(
    schoolId: number,
    classId: number,
    semester: 1 | 2,
    year: number
  ) {
    const cls = await db.query.classes.findFirst({
      where: and(eq(classes.schoolId, schoolId), eq(classes.id, classId), isNull(classes.deletedAt))
    });

    const monthsInSemester = semester === 1 
      ? [`${year}-07`, `${year}-08`, `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`]
      : [`${year + 1}-01`, `${year + 1}-02`, `${year + 1}-03`, `${year + 1}-04`, `${year + 1}-05`, `${year + 1}-06`];

    const rawData = await this.repository.getSemesterRecapData(schoolId, classId, year, semester as 1 | 2);
    const classStudents = await this.repository.findClassStudents(schoolId, classId);

    const attendanceDateMap = new Map<number, string>();
    (rawData?.attendances || []).forEach((a: any) => {
      attendanceDateMap.set(a.id, a.attendanceDate);
    });

    const rows = (rawData?.details || []).map((d: any) => ({
      studentId: d.studentId,
      attendanceDate: attendanceDateMap.get(d.attendanceId),
      status: d.status,
    }));

    const studentMap: Record<number, { studentId: number; studentName: string; nisn: string | null; records: any[] }> = {};
    classStudents.forEach(st => {
      studentMap[st.id] = {
        studentId: st.id,
        studentName: st.name,
        nisn: st.nisn,
        records: []
      };
    });

    rows.forEach((row: any) => {
      const target = studentMap[row.studentId];
      if (target) {
        target.records.push(row);
      }
    });

    const formattedStudents = Object.values(studentMap).map(st => {
      const monthlySummary: Record<string, { PRESENT: number; SICK: number; PERMISSION: number; ABSENT: number }> = {};
      monthsInSemester.forEach(m => {
        monthlySummary[m] = { PRESENT: 0, SICK: 0, PERMISSION: 0, ABSENT: 0 };
      });

      const grandTotal = { PRESENT: 0, SICK: 0, PERMISSION: 0, ABSENT: 0 };

      st.records.forEach(r => {
        const monthKey = r.attendanceDate?.slice(0, 7);
        if (monthKey && monthlySummary[monthKey]) {
          const status = r.status as "PRESENT" | "SICK" | "PERMISSION" | "ABSENT";
          if (monthlySummary[monthKey][status] !== undefined) {
            monthlySummary[monthKey][status] += 1;
            grandTotal[status] += 1;
          }
        }
      });

      return {
        studentId: st.studentId,
        studentName: st.studentName,
        nisn: st.nisn,
        monthlySummary,
        grandTotal,
      };
    });

    return {
      class: {
        id: cls?.id || classId,
        name: cls?.name || "Kelas",
      },
      semester,
      year,
      months: monthsInSemester,
      students: formattedStudents,
    };
  }

  private async handleAlphaDemeritPoints(
    schoolId: number,
    classId: number,
    attendanceDate: string,
    details: { studentId: number; status: string }[],
    reporterUserId: number
  ) {
    if (!details || details.length === 0) return;

    const absentStudents = details.filter(d => d.status === "ABSENT");

    try {
      const activeAY = await db.query.academicYears.findFirst({
        where: eq(academicYears.schoolId, schoolId)
      });
      const academicYearId = activeAY?.id || 1;

      let alphaType = await db.query.disciplineTypes.findFirst({
        where: and(
          eq(disciplineTypes.schoolId, schoolId),
          eq(disciplineTypes.code, "V-ALPHA"),
          isNull(disciplineTypes.deletedAt)
        )
      });

      if (!alphaType) {
        let violationCat = await db.query.disciplineCategories.findFirst({
          where: and(
            eq(disciplineCategories.schoolId, schoolId),
            eq(disciplineCategories.type, "VIOLATION"),
            isNull(disciplineCategories.deletedAt)
          )
        });

        if (!violationCat) {
          const [catRes] = await db.insert(disciplineCategories).values({
            schoolId,
            name: "Pelanggaran Presensi & Kehadiran",
            code: "CAT-ATT",
            type: "VIOLATION",
            description: "Kategori pelanggaran presensi dan absensi siswa",
          });
          violationCat = await db.query.disciplineCategories.findFirst({
            where: eq(disciplineCategories.id, catRes.insertId)
          });
        }

        if (violationCat) {
          const [typeRes] = await db.insert(disciplineTypes).values({
            schoolId,
            categoryId: violationCat.id,
            code: "V-ALPHA",
            name: "Ketidakhadiran Tanpa Keterangan (Alpha)",
            description: "Siswa tidak hadir sekolah/jam pelajaran tanpa surat izin resmi.",
            defaultPoints: 5,
          });
          alphaType = await db.query.disciplineTypes.findFirst({
            where: eq(disciplineTypes.id, typeRes.insertId)
          });
        }
      }

      if (!alphaType) {
        alphaType = await db.query.disciplineTypes.findFirst({
          where: and(eq(disciplineTypes.schoolId, schoolId), isNull(disciplineTypes.deletedAt))
        });
      }

      if (!alphaType) return;

      for (const st of absentStudents) {
        const existingStudentAlpha = await db
          .select({ id: disciplineIncidentStudents.id })
          .from(disciplineIncidentStudents)
          .innerJoin(disciplineIncidents, eq(disciplineIncidentStudents.incidentId, disciplineIncidents.id))
          .where(
            and(
              eq(disciplineIncidents.schoolId, schoolId),
              eq(disciplineIncidentStudents.studentId, st.studentId),
              eq(disciplineIncidentStudents.disciplineTypeId, alphaType.id),
              sql`DATE(${disciplineIncidents.incidentDate}) = ${attendanceDate}`,
              isNull(disciplineIncidents.deletedAt)
            )
          )
          .limit(1);

        if (existingStudentAlpha.length === 0) {
          const [incRes] = await db.insert(disciplineIncidents).values({
            schoolId,
            reporterUserId,
            incidentDate: new Date(attendanceDate),
            location: "Ruang Kelas",
            description: `Auto System: Siswa terdata Alpha (Tanpa Keterangan) pada presensi tanggal ${attendanceDate}`,
            status: "VERIFIED",
          });

          await db.insert(disciplineIncidentStudents).values({
            incidentId: incRes.insertId,
            studentId: st.studentId,
            classId,
            academicYearId,
            disciplineTypeId: alphaType.id,
            pointSnapshot: alphaType.defaultPoints || 5,
          });
        }
      }

      // Hapus / Batalkan otomatis Poin Alpha jika status diubah dari ABSENT menjadi PRESENT / SICK / PERMISSION
      const nonAbsentStudents = details.filter(d => d.status !== "ABSENT");
      for (const st of nonAbsentStudents) {
        const existingAlpha = await db
          .select({ incidentId: disciplineIncidentStudents.incidentId })
          .from(disciplineIncidentStudents)
          .innerJoin(disciplineIncidents, eq(disciplineIncidentStudents.incidentId, disciplineIncidents.id))
          .where(
            and(
              eq(disciplineIncidents.schoolId, schoolId),
              eq(disciplineIncidentStudents.studentId, st.studentId),
              eq(disciplineIncidentStudents.disciplineTypeId, alphaType.id),
              sql`(DATE(${disciplineIncidents.incidentDate}) = ${attendanceDate} OR ${disciplineIncidents.description} LIKE ${`%${attendanceDate}%`})`,
              isNull(disciplineIncidents.deletedAt)
            )
          );

        for (const row of existingAlpha) {
          await db.update(disciplineIncidents)
            .set({ deletedAt: new Date() })
            .where(eq(disciplineIncidents.id, row.incidentId));
        }
      }

      // Trigger automatic sanction evaluation
      await this.disciplineService.getSanctionLogs(schoolId, {});
    } catch (err) {
      console.error("[handleAlphaDemeritPoints Error]:", err);
    }
  }
}
