import { db } from "../db";
import { auditLogs } from "../schema/auditLogs";

export interface LogAuditParams {
  schoolId: number;
  userId: number;
  action: string;
  tableName: string;
  recordId?: number;
  oldValues?: any;
  newValues?: any;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await db.insert(auditLogs).values({
      schoolId: params.schoolId,
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId ?? null,
      oldValues: params.oldValues ?? null,
      newValues: params.newValues ?? null,
    });
  } catch (err) {
    console.error("[AuditLog Insert Failed]", err);
  }
}
