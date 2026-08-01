import { db } from "../db";
import { teachers } from "../schema/teachers";
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
 */
export async function getTeacherIdFromUserId(schoolId: number, userId: number): Promise<number> {
  const result = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.userId, userId), isNull(teachers.deletedAt)))
    .limit(1);

  const teacher = result[0];
  if (!teacher) {
    throw new ForbiddenError("Profil guru tidak ditemukan untuk akun Anda. Hubungi administrator.");
  }
  return teacher.id;
}
