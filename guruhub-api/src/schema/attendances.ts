import { mysqlTable, serial, text, mysqlEnum, date, timestamp, bigint, uniqueIndex, index } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { schedules } from "./schedules";
import { teachers } from "./teachers";
import { students } from "./students";

export const attendances = mysqlTable("attendances", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  scheduleId: bigint("schedule_id", { mode: "number", unsigned: true }).notNull().references(() => schedules.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("uq_schedule_attendance_date").on(table.schoolId, table.scheduleId, table.attendanceDate)
]);

export const attendanceDetails = mysqlTable("attendance_details", {
  id: serial("id").primaryKey(),
  attendanceId: bigint("attendance_id", { mode: "number", unsigned: true }).notNull().references(() => attendances.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["PRESENT", "SICK", "PERMISSION", "ABSENT"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_att_details_student_status").on(table.studentId, table.status),
  index("idx_att_details_attendance_id").on(table.attendanceId)
]);
