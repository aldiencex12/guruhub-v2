import { mysqlTable, serial, text, mysqlEnum, int, json, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { students } from "./students";
import { classes } from "./classes";
import { academicYears } from "./academicYears";

export const raports = mysqlTable("raports", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  notes: text("notes"), // Catatan Wali Kelas
  extracurriculars: json("extracurriculars"), // [{name: "Pramuka", score: "A", note: "Sangat Aktif"}]
  attendanceSick: int("attendance_sick").default(0).notNull(),
  attendancePermission: int("attendance_permission").default(0).notNull(),
  attendanceAbsent: int("attendance_absent").default(0).notNull(),
  status: mysqlEnum("status", ["Draft", "Published"]).default("Draft").notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_student_academic_year").on(table.schoolId, table.studentId, table.academicYearId)
]);
