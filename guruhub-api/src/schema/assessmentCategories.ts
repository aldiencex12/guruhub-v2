import { mysqlTable, serial, varchar, text, timestamp, bigint, boolean, int, index } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { teachers } from "./teachers";

export const assessmentCategories = mysqlTable("assessment_categories", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  teacherId: bigint("teacher_id", { mode: "number", unsigned: true }).references(() => teachers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: int("weight").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("idx_school_id").on(table.schoolId)
]);

export type AssessmentCategory = typeof assessmentCategories.$inferSelect;
export type NewAssessmentCategory = typeof assessmentCategories.$inferInsert;
