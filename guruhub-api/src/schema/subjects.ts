import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { classes } from "./classes";
import { teachers } from "./teachers";

export const subjects = mysqlTable("subjects", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(), // e.g. "IND-SMP7"
  gradeLevel: mysqlEnum("grade_level", ["7", "8", "9", "10", "11", "12"]).notNull(),
  religionGroup: mysqlEnum("religion_group", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu", "UMUM"]).default("UMUM").notNull(),
  description: varchar("description", { length: 255 }),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(), // Status mapel
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_subject_code").on(table.schoolId, table.code, table.deletedAt),
  uniqueIndex("uq_school_subject_name_grade").on(table.schoolId, table.name, table.gradeLevel, table.deletedAt)
]);

export const subjectTeachers = mysqlTable("subject_teachers", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("uq_school_class_subject").on(table.schoolId, table.classId, table.subjectId)
]);
