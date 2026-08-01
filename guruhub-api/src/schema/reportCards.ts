import { mysqlTable, serial, bigint, text, mysqlEnum, timestamp, varchar, int, uniqueIndex, index, foreignKey } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { students } from "./students";
import { classes } from "./classes";
import { academicYears } from "./academicYears";
import { subjects } from "./subjects";

export const reportCards = mysqlTable("report_cards", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  semester: mysqlEnum("semester", ["GANJIL", "GENAP"]).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("DRAFT"),
  homeroomTeacherNotes: text("homeroom_teacher_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("uq_student_ay_semester").on(table.studentId, table.academicYearId, table.semester),
  index("idx_report_cards_school").on(table.schoolId),
  index("idx_report_cards_class").on(table.classId),
]);

export const reportCardSubjects = mysqlTable("report_card_subjects", {
  id: serial("id").primaryKey(),
  reportCardId: bigint("report_card_id", { mode: "number", unsigned: true }).notNull().references(() => reportCards.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  finalScore: double("final_score").notNull(),
  gradeLetter: varchar("grade_letter", { length: 2 }).notNull(),
  knowledgeDescription: text("knowledge_description"),
}, (table) => [
  uniqueIndex("uq_report_card_subject").on(table.reportCardId, table.subjectId),
]);

export const reportCardAttendances = mysqlTable("report_card_attendances", {
  id: serial("id").primaryKey(),
  reportCardId: bigint("report_card_id", { mode: "number", unsigned: true }).notNull().unique().references(() => reportCards.id, { onDelete: "cascade" }),
  sick: int("sick").notNull().default(0),
  permission: int("permission").notNull().default(0),
  absent: int("absent").notNull().default(0),
});

export const extracurriculars = mysqlTable("extracurriculars", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("idx_extracurriculars_school").on(table.schoolId),
]);

export const studentExtracurriculars = mysqlTable("student_extracurriculars", {
  id: serial("id").primaryKey(),
  reportCardId: bigint("report_card_id", { mode: "number", unsigned: true }).notNull().references(() => reportCards.id, { onDelete: "cascade" }),
  extracurricularId: bigint("extracurricular_id", { mode: "number", unsigned: true }).notNull(),
  predicate: mysqlEnum("predicate", ["A", "B", "C", "D"]).notNull(),
  description: text("description"),
}, (table) => [
  foreignKey({
    name: "fk_stud_ext_ext_id",
    columns: [table.extracurricularId],
    foreignColumns: [extracurriculars.id]
  }).onDelete("cascade")
]);

export const studentAchievements = mysqlTable("student_achievements", {
  id: serial("id").primaryKey(),
  reportCardId: bigint("report_card_id", { mode: "number", unsigned: true }).notNull().references(() => reportCards.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  level: mysqlEnum("level", ["SCHOOL", "DISTRICT", "PROVINCE", "NATIONAL", "INTERNATIONAL"]).notNull(),
  description: text("description"),
});

export const p5Projects = mysqlTable("p5_projects", {
  id: serial("id").primaryKey(),
  reportCardId: bigint("report_card_id", { mode: "number", unsigned: true }).notNull().references(() => reportCards.id, { onDelete: "cascade" }),
  theme: varchar("theme", { length: 255 }).notNull(),
  predicate: mysqlEnum("predicate", ["SB", "B", "C", "PB"]).notNull(),
  description: text("description"),
});

import { double } from "drizzle-orm/mysql-core";
