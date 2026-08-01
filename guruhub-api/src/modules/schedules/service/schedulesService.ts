import { SchedulesRepository } from "../repository/schedulesRepository";
import { TeachersRepository } from "../../teachers/repository/teachersRepository";
import { SubjectsRepository } from "../../subjects/repository/subjectsRepository";
import { ClassesRepository } from "../../classes/repository/classesRepository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/customErrors";
import { schedules } from "../../../schema/schedules";
import { academicYears } from "../../../schema/academicYears";
import { db } from "../../../db";
import { eq, and } from "drizzle-orm";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class SchedulesService {
  private repository = new SchedulesRepository();
  private teachersRepository = new TeachersRepository();
  private subjectsRepository = new SubjectsRepository();
  private classesRepository = new ClassesRepository();

  private timeToMinutes(timeStr: string): number {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    return hours * 60 + minutes;
  }

  private isOverlapping(s1: string, e1: string, s2: string, e2: string): boolean {
    const start1 = this.timeToMinutes(s1);
    const end1 = this.timeToMinutes(e1);
    const start2 = this.timeToMinutes(s2);
    const end2 = this.timeToMinutes(e2);

    return start1 < end2 && start2 < end1;
  }

  async getAllSchedules(schoolId: number, user: UserContext, query?: any) {
    let filterTeacherId: number | undefined;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      filterTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
    }
    
    return await this.repository.findAll(schoolId, filterTeacherId, query);
  }

  async getScheduleById(schoolId: number, user: UserContext, id: number) {
    const schedule = await this.repository.findById(schoolId, id);
    if (!schedule) {
      throw new NotFoundError("Jadwal pelajaran tidak ditemukan");
    }

    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const myTeacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (schedule.teacherId !== myTeacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak akses untuk jadwal pelajaran ini");
      }
    }

    return schedule;
  }

  async createSchedule(schoolId: number, data: Omit<typeof schedules.$inferInsert, "schoolId" | "id">) {
    // 1. Validasi Relasi dan Tenant
    const teacher = await this.teachersRepository.findById(schoolId, data.teacherId);
    if (!teacher) {
      throw new BadRequestError("Guru harus terdaftar di sekolah yang sama");
    }

    const subject = await this.subjectsRepository.findById(schoolId, data.subjectId);
    if (!subject) {
      throw new BadRequestError("Mata pelajaran harus terdaftar di sekolah yang sama");
    }

    const cls = await this.classesRepository.findById(schoolId, data.classId);
    if (!cls) {
      throw new BadRequestError("Kelas harus terdaftar di sekolah yang sama");
    }

    const year = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, data.academicYearId), eq(academicYears.schoolId, schoolId)))
      .limit(1);
    if (year.length === 0) {
      throw new BadRequestError("Tahun ajaran harus terdaftar di sekolah yang sama");
    }

    // Validasi waktu logis (startTime < endTime)
    if (this.timeToMinutes(data.startTime) >= this.timeToMinutes(data.endTime)) {
      throw new BadRequestError("Jam mulai harus lebih awal dibanding jam selesai");
    }

    // 2. Cegah bentrok jadwal guru
    const teacherSchedules = await this.repository.findTeacherSchedulesByDay(schoolId, data.teacherId, data.dayOfWeek);
    for (const ts of teacherSchedules) {
      if (this.isOverlapping(ts.startTime, ts.endTime, data.startTime, data.endTime)) {
        throw new ConflictError("Guru tersebut sudah memiliki jadwal mengajar pada jam ini");
      }
    }

    // 3. Cegah bentrok jadwal kelas
    const classSchedules = await this.repository.findClassSchedulesByDay(schoolId, data.classId, data.dayOfWeek);
    for (const cs of classSchedules) {
      if (this.isOverlapping(cs.startTime, cs.endTime, data.startTime, data.endTime)) {
        throw new ConflictError("Kelas tersebut sudah memiliki jadwal pelajaran lain pada jam ini");
      }
    }

    return await this.repository.create(schoolId, data);
  }

  async updateSchedule(schoolId: number, id: number, data: Partial<typeof schedules.$inferInsert>) {
    const existing = await this.repository.findById(schoolId, id);
    if (!existing) {
      throw new NotFoundError("Jadwal pelajaran tidak ditemukan");
    }

    // Validasi relasi jika diubah
    const teacherId = data.teacherId ?? existing.teacherId;
    if (data.teacherId && data.teacherId !== existing.teacherId) {
      const teacher = await this.teachersRepository.findById(schoolId, data.teacherId);
      if (!teacher) {
        throw new BadRequestError("Guru harus terdaftar di sekolah yang sama");
      }
    }

    const subjectId = data.subjectId ?? existing.subjectId;
    if (data.subjectId && data.subjectId !== existing.subjectId) {
      const subject = await this.subjectsRepository.findById(schoolId, data.subjectId);
      if (!subject) {
        throw new BadRequestError("Mata pelajaran harus terdaftar di sekolah yang sama");
      }
    }

    const classId = data.classId ?? existing.classId;
    if (data.classId && data.classId !== existing.classId) {
      const cls = await this.classesRepository.findById(schoolId, data.classId);
      if (!cls) {
        throw new BadRequestError("Kelas harus terdaftar di sekolah yang sama");
      }
    }

    const academicYearId = data.academicYearId ?? existing.academicYearId;
    if (data.academicYearId && data.academicYearId !== existing.academicYearId) {
      const year = await db
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.id, data.academicYearId), eq(academicYears.schoolId, schoolId)))
        .limit(1);
      if (year.length === 0) {
        throw new BadRequestError("Tahun ajaran harus terdaftar di sekolah yang sama");
      }
    }

    const dayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestError("Jam mulai harus lebih awal dibanding jam selesai");
    }

    // Cek bentrok guru jika jam/hari/guru diubah
    if (data.teacherId || data.dayOfWeek || data.startTime || data.endTime) {
      const teacherSchedules = await this.repository.findTeacherSchedulesByDay(schoolId, teacherId, dayOfWeek);
      for (const ts of teacherSchedules) {
        if (Number(ts.id) !== Number(id) && this.isOverlapping(ts.startTime, ts.endTime, startTime, endTime)) {
          throw new ConflictError("Guru tersebut sudah memiliki jadwal mengajar pada jam ini");
        }
      }
    }

    // Cek bentrok kelas jika jam/hari/kelas diubah
    if (data.classId || data.dayOfWeek || data.startTime || data.endTime) {
      const classSchedules = await this.repository.findClassSchedulesByDay(schoolId, classId, dayOfWeek);
      for (const cs of classSchedules) {
        if (Number(cs.id) !== Number(id) && this.isOverlapping(cs.startTime, cs.endTime, startTime, endTime)) {
          throw new ConflictError("Kelas tersebut sudah memiliki jadwal pelajaran lain pada jam ini");
        }
      }
    }

    return await this.repository.update(schoolId, id, data);
  }

  async deleteSchedule(schoolId: number, id: number) {
    const existing = await this.repository.findById(schoolId, id);
    if (!existing) {
      throw new NotFoundError("Jadwal pelajaran tidak ditemukan");
    }

    await this.repository.softDelete(schoolId, id);
  }

  async bulkDeleteSchedules(schoolId: number, ids: number[]) {
    if (ids.length === 0) return;
    await this.repository.bulkSoftDelete(schoolId, ids);
  }

  async deleteAllSchedules(schoolId: number) {
    await this.repository.softDeleteAll(schoolId);
  }
}
