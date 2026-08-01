import { eq, and } from "drizzle-orm";
import { db } from "../../../db";
import { schools } from "../../../schema/schools";
import { users } from "../../../schema/users";
import { sessions } from "../../../schema/sessions";
import { auditLogs } from "../../../schema/auditLogs";

export class AuthRepository {
  async findSchoolById(schoolId: number) {
    const result = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    return result[0] || null;
  }

  async findUserByEmail(schoolId: number, email: string) {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.email, email)))
      .limit(1);
    return result[0] || null;
  }

  async findUserById(schoolId: number, userId: number) {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.id, userId)))
      .limit(1);
    return result[0] || null;
  }

  async createSession(sessionData: typeof sessions.$inferInsert) {
    await db.insert(sessions).values(sessionData);
  }

  async findSession(schoolId: number, userId: number, tokenId: string) {
    const result = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.schoolId, schoolId),
          eq(sessions.userId, userId),
          eq(sessions.tokenId, tokenId)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async revokeSession(schoolId: number, userId: number, tokenId: string) {
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(
        and(
          eq(sessions.schoolId, schoolId),
          eq(sessions.userId, userId),
          eq(sessions.tokenId, tokenId)
        )
      );
  }

  async revokeAllUserSessions(schoolId: number, userId: number) {
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(and(eq(sessions.schoolId, schoolId), eq(sessions.userId, userId)));
  }

  async createAuditLog(logData: typeof auditLogs.$inferInsert) {
    await db.insert(auditLogs).values(logData);
  }
}
