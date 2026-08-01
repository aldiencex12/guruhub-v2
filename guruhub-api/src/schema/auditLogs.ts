import { mysqlTable, serial, varchar, json, timestamp, bigint } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { users } from "./users";

export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).references(() => schools.id, { onDelete: "set null" }), // Nullable jika dilakukan global admin
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "UPDATE_SCORE", "DELETE_STUDENT"
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: bigint("record_id", { mode: "number", unsigned: true }),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});
