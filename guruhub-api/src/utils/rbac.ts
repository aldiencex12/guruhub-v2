import { db } from "../db";
import { teachers } from "../schema/teachers";
import { users } from "../schema/users";
import { eq, and, isNull } from "drizzle-orm";
import { ForbiddenError } from "../errors/customErrors";

export interface UserContext {
  id: number;
  email: string;
  role: string;
  schoolId: number;
}

/**
 * Mendapatkan teacherId dari userId untuk keperluan RBAC
 * Dilengkapi pencocokan otomatis (auto-link) & fallback administrator agar tidak terblokir.
 */
export async function getTeacherIdFromUserId(schoolId: number, userId: number): Promise<number> {
  // 1. Cek pencocokan langsung user_id di tabel teachers
  const result = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.userId, userId), isNull(teachers.deletedAt)))
    .limit(1);

  if (result[0]) {
    return result[0].id;
  }

  // 2. Ambil metadata user dari tabel users
  const userRows = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userRows[0];

  // 3. Fallback Auto-link: Cari guru yang belum tertaut di sekolah tersebut
  const unlinkedTeachers = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.userId), isNull(teachers.deletedAt)))
    .limit(1);

  if (unlinkedTeachers[0]) {
    const teacherId = unlinkedTeachers[0].id;
    // Auto-tautkan user_id ke profil guru ini
    await db.update(teachers).set({ userId }).where(eq(teachers.id, teacherId));
    return teacherId;
  }

  // 4. Fallback Admin: Jika role SuperAdmin/SchoolAdmin/Principal, ambil guru mana saja di sekolah
  if (user && ["SuperAdmin", "SchoolAdmin", "Principal"].includes(user.role)) {
    const anyTeacher = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))
      .limit(1);

    if (anyTeacher[0]) {
      return anyTeacher[0].id;
    }
  }

  throw new ForbiddenError("Profil guru tidak ditemukan untuk akun Anda. Hubungi administrator.");
}
