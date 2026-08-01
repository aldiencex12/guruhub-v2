import { mysqlTable, serial, bigint, double, varchar, timestamp, uniqueIndex, index } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { students } from "./students";
import { classes } from "./classes";
import { subjects } from "./subjects";
import { academicYears } from "./academicYears";

export const studentFinalGrades = mysqlTable("student_final_grades", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: bigint("subject_id", { mode: "number", unsigned: true }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  finalScore: double("final_score").notNull(),
  gradeLetter: varchar("grade_letter", { length: 2 }).notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_student_subject_ay").on(table.studentId, table.subjectId, table.academicYearId),
  index("idx_final_grades_school").on(table.schoolId),
  index("idx_final_grades_student").on(table.studentId),
  index("idx_final_grades_subject").on(table.subjectId),
  index("idx_final_grades_ay").on(table.academicYearId),
]);

export type StudentFinalGrade = typeof studentFinalGrades.$inferSelect;
export type NewStudentFinalGrade = typeof studentFinalGrades.$inferInsert;
