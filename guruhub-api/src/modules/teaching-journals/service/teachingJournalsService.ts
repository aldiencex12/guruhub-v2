import { TeachingJournalsRepository } from "../repository/teachingJournalsRepository";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "../../../errors/customErrors";
import { teachingJournals } from "../../../schema/teachingJournals";
import { teachers } from "../../../schema/teachers";
import { schedules } from "../../../schema/schedules";
import { attendances } from "../../../schema/attendances";
import { db } from "../../../db";
import { eq, and, isNull } from "drizzle-orm";

import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class TeachingJournalsService {
  private repository = new TeachingJournalsRepository();



  async getAllTeachingJournals(
    schoolId: number,
    user: UserContext,
    filters: { teacherId?: number; classId?: number; subjectId?: number; journalDate?: string }
  ) {
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      filters.teacherId = myTeacherId;
    }
    return await this.repository.findAll(schoolId, filters);
  }

  async getTeachingJournalById(schoolId: number, user: UserContext, id: number) {
    const journal = await this.repository.findById(schoolId, id);
    if (!journal) {
      throw new NotFoundError("Jurnal mengajar tidak ditemukan");
    }

    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (journal.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk jurnal ini");
      }
    }

    return journal;
  }

  async createTeachingJournal(
    schoolId: number,
    user: UserContext,
    data: Omit<typeof teachingJournals.$inferInsert, "schoolId" | "id">
  ) {
    // 1. Logika Validasi Hak Akses Guru (hanya boleh mengisi jurnal miliknya sendiri)
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (data.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda hanya diperbolehkan mengelola jurnal mengajar Anda sendiri");
      }
    }

    // 2. Validasi Guru eksis dan satu tenant
    const teacherQuery = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, data.teacherId))
      .limit(1);

    const teacher = teacherQuery[0];
    if (!teacher || teacher.deletedAt) {
      throw new NotFoundError("Guru tidak ditemukan");
    }
    if (teacher.schoolId !== schoolId) {
      throw new BadRequestError("Guru harus berasal dari sekolah yang sama");
    }

    // 3. Validasi Jadwal eksis, satu tenant, dan guru sesuai jadwal
    const scheduleQuery = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, data.scheduleId))
      .limit(1);

    const schedule = scheduleQuery[0];
    if (!schedule || schedule.deletedAt) {
      throw new NotFoundError("Jadwal pelajaran tidak ditemukan");
    }
    if (schedule.schoolId !== schoolId) {
      throw new BadRequestError("Jadwal pelajaran harus berasal dari sekolah yang sama");
    }
    if (schedule.teacherId !== data.teacherId) {
      throw new BadRequestError("Guru tidak terdaftar untuk jadwal pelajaran ini");
    }

    // 4. Validasi Absensi (jika diisi) eksis dan satu tenant
    if (data.attendanceId) {
      const attendanceQuery = await db
        .select()
        .from(attendances)
        .where(eq(attendances.id, data.attendanceId))
        .limit(1);

      const attendance = attendanceQuery[0];
      if (!attendance || attendance.deletedAt) {
        throw new NotFoundError("Absensi tidak ditemukan");
      }
      if (attendance.schoolId !== schoolId) {
        throw new BadRequestError("Absensi harus berasal dari sekolah yang sama");
      }
    }

    // 5. Validasi Duplikasi (scheduleId + journalDate)
    const duplicate = await this.repository.findByScheduleAndDate(data.scheduleId, data.journalDate);
    if (duplicate) {
      throw new ConflictError("Jurnal untuk jadwal pelajaran pada tanggal ini sudah dibuat");
    }

    return await this.repository.create(schoolId, data);
  }

  async updateTeachingJournal(
    schoolId: number,
    user: UserContext,
    id: number,
    data: Partial<typeof teachingJournals.$inferInsert>
  ) {
    const journal = await this.repository.findById(schoolId, id);
    if (!journal) {
      throw new NotFoundError("Jurnal mengajar tidak ditemukan");
    }

    // Validasi kepemilikan jurnal untuk guru
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (journal.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk memperbarui jurnal ini");
      }
    }

    const updatedTeacherId = data.teacherId ?? journal.teacherId;
    const updatedScheduleId = data.scheduleId ?? journal.scheduleId;
    const updatedJournalDate = data.journalDate ?? journal.journalDate;

    // Jika mengubah guru
    if (data.teacherId !== undefined && data.teacherId !== journal.teacherId) {
      if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
        throw new ForbiddenError("Anda tidak diperbolehkan mengubah kepemilikan jurnal");
      }
      const tQuery = await db.select().from(teachers).where(eq(teachers.id, data.teacherId)).limit(1);
      const t = tQuery[0];
      if (!t || t.deletedAt) {
        throw new NotFoundError("Guru tidak ditemukan");
      }
      if (t.schoolId !== schoolId) {
        throw new BadRequestError("Guru harus berasal dari sekolah yang sama");
      }
    }

    // Jika mengubah jadwal
    if (data.scheduleId !== undefined && data.scheduleId !== journal.scheduleId) {
      const sQuery = await db.select().from(schedules).where(eq(schedules.id, data.scheduleId)).limit(1);
      const s = sQuery[0];
      if (!s || s.deletedAt) {
        throw new NotFoundError("Jadwal pelajaran tidak ditemukan");
      }
      if (s.schoolId !== schoolId) {
        throw new BadRequestError("Jadwal pelajaran harus berasal dari sekolah yang sama");
      }
      if (s.teacherId !== updatedTeacherId) {
        throw new BadRequestError("Guru tidak terdaftar untuk jadwal pelajaran ini");
      }
    }

    // Jika mengubah absensi
    if (data.attendanceId !== undefined && data.attendanceId !== journal.attendanceId && data.attendanceId !== null) {
      const aQuery = await db.select().from(attendances).where(eq(attendances.id, data.attendanceId)).limit(1);
      const a = aQuery[0];
      if (!a || a.deletedAt) {
        throw new NotFoundError("Absensi tidak ditemukan");
      }
      if (a.schoolId !== schoolId) {
        throw new BadRequestError("Absensi harus berasal dari sekolah yang sama");
      }
    }

    // Cek duplikasi jika jadwal atau tanggal diubah
    if (data.scheduleId !== undefined || data.journalDate !== undefined) {
      const duplicate = await this.repository.findByScheduleAndDate(updatedScheduleId, updatedJournalDate);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError("Jurnal untuk jadwal pelajaran pada tanggal ini sudah dibuat");
      }
    }

    return await this.repository.update(schoolId, id, data);
  }

  async deleteTeachingJournal(schoolId: number, user: UserContext, id: number) {
    const journal = await this.repository.findById(schoolId, id);
    if (!journal) {
      throw new NotFoundError("Jurnal mengajar tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }
}
