import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { academicYears } from "./academicYears";
import { teachers } from "./teachers";
import { students } from "./students";

export const classes = mysqlTable("classes", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  homeroomTeacherId: bigint("homeroom_teacher_id", { mode: "number", unsigned: true }).references(() => teachers.id, { onDelete: "set null" }), // Wali kelas
  name: varchar("name", { length: 50 }).notNull(), // e.g., "VII-A", "X-MIPA-1"
  gradeLevel: mysqlEnum("grade_level", ["7", "8", "9", "10", "11", "12"]).notNull(),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(), // Status kelas
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_year_class_name").on(table.schoolId, table.academicYearId, table.name, table.deletedAt)
]);

export const classStudents = mysqlTable("class_students", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("uq_school_student_year_class").on(table.schoolId, table.classId, table.studentId)
]);
