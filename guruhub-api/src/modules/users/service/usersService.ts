import { UsersRepository } from "../repository/usersRepository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/customErrors";
import { users } from "../../../schema/users";
import { teachers } from "../../../schema/teachers";
import { students } from "../../../schema/students";
import { db } from "../../../db";
import { isNull, eq, and } from "drizzle-orm";

export class UsersService {
  private repository = new UsersRepository();

  async getAllUsers(
    schoolId: number,
    options: { page: number; limit: number; search?: string; role?: string; status?: string }
  ) {
    return await this.repository.findAll(schoolId, options);
  }

  async getUserById(schoolId: number, id: number) {
    const user = await this.repository.findById(schoolId, id);
    if (!user) {
      throw new NotFoundError("Akun tidak ditemukan");
    }
    return user;
  }

  async createUser(
    schoolId: number,
    data: { email: string; password?: string; role: any; status?: any; teacherId?: number }
  ) {
    // Check if email already exists
    const existing = await this.repository.findByEmail(schoolId, data.email);
    if (existing) {
      throw new ConflictError("Email sudah terdaftar di sekolah ini");
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestError("Password minimal 6 karakter");
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const result = await this.repository.create(schoolId, {
      email: data.email,
      passwordHash,
      role: data.role,
      status: data.status || "Aktif",
    });

    if (data.teacherId && (data.role === "Teacher" || data.role === "HomeroomTeacher" || data.role === "Principal")) {
      await db.update(teachers).set({ userId: result.insertId }).where(eq(teachers.id, data.teacherId));
    }

    return result;
  }

  async updateUser(
    schoolId: number,
    id: number,
    data: Partial<{ email: string; role: any; status: any }>
  ) {
    const user = await this.repository.findById(schoolId, id);
    if (!user) {
      throw new NotFoundError("Akun tidak ditemukan");
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.repository.findByEmail(schoolId, data.email);
      if (existing) {
        throw new ConflictError("Email sudah terdaftar di sekolah ini");
      }
    }

    // Role cannot be changed if they are the last SuperAdmin? 
    // We can just proceed with updating it.
    
    return await this.repository.update(schoolId, id, data);
  }

  async resetPassword(schoolId: number, id: number, newPassword: string) {
    const user = await this.repository.findById(schoolId, id);
    if (!user) {
      throw new NotFoundError("Akun tidak ditemukan");
    }

    if (newPassword.length < 6) {
      throw new BadRequestError("Password minimal 6 karakter");
    }

    const passwordHash = await Bun.password.hash(newPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });
    await this.repository.updatePassword(schoolId, id, passwordHash);
  }

  async deleteUser(schoolId: number, id: number) {
    const user = await this.repository.findById(schoolId, id);
    if (!user) {
      throw new NotFoundError("Akun tidak ditemukan");
    }

    await this.repository.delete(schoolId, id);
  }

  async generateBulkAccounts(schoolId: number) {
    const passwordHash = await Bun.password.hash("GuruHub!2026", {
      algorithm: "bcrypt",
      cost: 10,
    });

    const [unassignedTeachers, unassignedStudents] = await Promise.all([
      db.select().from(teachers).where(and(eq(teachers.schoolId, schoolId), isNull(teachers.userId), isNull(teachers.deletedAt))),
      db.select().from(students).where(and(eq(students.schoolId, schoolId), isNull(students.userId), isNull(students.deletedAt)))
    ]);

    let generatedTeachers = 0;
    let generatedStudents = 0;

    for (const t of unassignedTeachers) {
      // Email dari nama guru: "Budi Santoso" -> "budisantoso@guruhub.sch.id"
      const cleanName = t.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
      const baseEmail = `${cleanName}@guruhub.sch.id`;
      // Jika email sudah ada, tambah ID guru di belakang nama
      const existingByBase = await this.repository.findByEmail(schoolId, baseEmail);
      const email = existingByBase ? `${cleanName}${t.id}@guruhub.sch.id` : baseEmail;
      
      const existing = await this.repository.findByEmail(schoolId, email);
      if (existing) continue;

      const newUser = await this.repository.create(schoolId, {
        email,
        passwordHash,
        role: "Teacher",
        status: "Aktif",
      });

      await db.update(teachers).set({ userId: newUser!.id }).where(eq(teachers.id, t.id));
      generatedTeachers++;
    }

    for (const s of unassignedStudents) {
      // Email dari nama siswa: "Andi Setiawan" -> "andisetiawan@guruhub.sch.id"
      const cleanName = s.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
      const baseEmail = `${cleanName}@guruhub.sch.id`;
      const existingByBase = await this.repository.findByEmail(schoolId, baseEmail);
      const email = existingByBase ? `${cleanName}${s.id}@guruhub.sch.id` : baseEmail;
      
      const existing = await this.repository.findByEmail(schoolId, email);
      if (existing) continue;

      const newUser = await this.repository.create(schoolId, {
        email,
        passwordHash,
        role: "Student",
        status: "Aktif",
      });

      await db.update(students).set({ userId: newUser!.id }).where(eq(students.id, s.id));
      generatedStudents++;
    }

    return {
      generatedTeachers,
      generatedStudents,
      totalGenerated: generatedTeachers + generatedStudents
    };
  }

  async deleteBulkAccounts(schoolId: number) {
    // Hapus semua akun Teacher & Student (bukan Admin/Principal) yang ada di sekolah ini
    // Dan reset userId di tabel teachers/students
    const teacherUsers = await db
      .select({ id: teachers.id, userId: teachers.userId })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId)));
    
    const studentUsers = await db
      .select({ id: students.id, userId: students.userId })
      .from(students)
      .where(and(eq(students.schoolId, schoolId)));

    let deleted = 0;

    // Reset userId di tabel teachers
    for (const t of teacherUsers) {
      if (t.userId) {
        await db.update(teachers).set({ userId: null }).where(eq(teachers.id, t.id));
        await this.repository.delete(schoolId, t.userId);
        deleted++;
      }
    }

    // Reset userId di tabel students
    for (const s of studentUsers) {
      if (s.userId) {
        await db.update(students).set({ userId: null }).where(eq(students.id, s.id));
        await this.repository.delete(schoolId, s.userId);
        deleted++;
      }
    }

    return { deleted };
  }
}
