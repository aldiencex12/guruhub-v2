import { mysqlTable, serial, varchar, text, mysqlEnum, timestamp, bigint, date, int } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { classes } from "./classes";
import { subjects } from "./subjects";
import { teachers } from "./teachers";
import { academicYears } from "./academicYears";
import { students } from "./students";
import { assessmentCategories } from "./assessmentCategories";

export const assessments = mysqlTable("assessments", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).notNull().references(() => teachers.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).references(() => assessmentCategories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assessmentType: mysqlEnum("assessment_type", ["DAILY_TEST", "ASSIGNMENT", "PROJECT", "PRACTICAL", "MIDTERM", "FINAL", "TUGAS_1", "TUGAS_2", "STS"]).notNull(),
  assessmentDate: date("assessment_date", { mode: "string" }).notNull(),
  maxScore: int("max_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const assessmentScores = mysqlTable("assessment_scores", {
  id: serial("id").primaryKey(),
  assessmentId: bigint("assessment_id", { mode: "number", unsigned: true }).notNull().references(() => assessments.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  score: int("score").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentScore = typeof assessmentScores.$inferSelect;
export type NewAssessmentScore = typeof assessmentScores.$inferInsert;
