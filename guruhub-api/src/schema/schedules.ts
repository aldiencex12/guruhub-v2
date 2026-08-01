import { mysqlTable, serial, varchar, mysqlEnum, time, timestamp, bigint } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { classes } from "./classes";
import { subjects } from "./subjects";
import { teachers } from "./teachers";
import { academicYears } from "./academicYears";

export const schedules = mysqlTable("schedules", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  dayOfWeek: mysqlEnum("day_of_week", ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
