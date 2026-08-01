import { mysqlTable, serial, varchar, mysqlEnum, boolean, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";

export const academicYears = mysqlTable("academic_years", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  year: varchar("year", { length: 9 }).notNull(), // e.g. "2025/2026"
  semester: mysqlEnum("semester", ["Ganjil", "Genap"]).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_academic_semester").on(table.schoolId, table.year, table.semester)
]);
