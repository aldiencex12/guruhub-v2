import { mysqlTable, serial, mysqlEnum, timestamp, bigint } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { classes } from "./classes";
import { students } from "./students";
import { academicYears } from "./academicYears";

export const classMembers = mysqlTable("class_members", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => students.id, { onDelete: "cascade" }),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).default("ACTIVE").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
