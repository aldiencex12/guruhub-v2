import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Student", "Polsis"]).notNull(),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_email").on(table.schoolId, table.email)
]);
