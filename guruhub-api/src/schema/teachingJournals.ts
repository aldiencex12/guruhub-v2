import { mysqlTable, serial, varchar, text, date, timestamp, bigint, index } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { schedules } from "./schedules";
import { teachers } from "./teachers";
import { attendances } from "./attendances";

export const teachingJournals = mysqlTable("teaching_journals", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  scheduleId: bigint("schedule_id", { mode: "number", unsigned: true }).notNull().references(() => schedules.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  attendanceId: bigint("attendance_id", { mode: "number", unsigned: true }).references(() => attendances.id, { onDelete: "set null" }),
  journalDate: date("journal_date", { mode: "string" }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  learningObjectives: text("learning_objectives").notNull(),
  teachingMethod: varchar("teaching_method", { length: 255 }).notNull(),
  reflection: text("reflection"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  idxScheduleId: index("idx_schedule_id").on(table.scheduleId),
}));
