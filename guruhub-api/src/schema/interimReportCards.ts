import { mysqlTable, serial, varchar, text, mysqlEnum, timestamp, bigint, int } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { students } from "./students";
import { classes } from "./classes";
import { academicYears } from "./academicYears";
import { subjects } from "./subjects";

export const interimReportCards = mysqlTable("interim_report_cards", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  semester: mysqlEnum("semester", ["GANJIL", "GENAP"]).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).default("DRAFT").notNull(),
  homeroomTeacherNotes: text("homeroom_teacher_notes"),
  sick: int("sick").default(0),
  permission: int("permission").default(0),
  absent: int("absent").default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const interimReportCardSubjects = mysqlTable("interim_report_card_subjects", {
  id: serial("id").primaryKey(),
  interimReportCardId: bigint("interim_report_card_id", { mode: "number", unsigned: true }).notNull().references(() => interimReportCards.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  tugas1: int("tugas_1"),
  tugas2: int("tugas_2"),
  sts: int("sts"),
  finalScore: int("final_score").notNull(),
  gradeLetter: varchar("grade_letter", { length: 5 }),
  notes: text("notes"),
});

export type InterimReportCard = typeof interimReportCards.$inferSelect;
export type NewInterimReportCard = typeof interimReportCards.$inferInsert;
export type InterimReportCardSubject = typeof interimReportCardSubjects.$inferSelect;
export type NewInterimReportCardSubject = typeof interimReportCardSubjects.$inferInsert;
