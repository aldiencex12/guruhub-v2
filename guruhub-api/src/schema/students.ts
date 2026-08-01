import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { users } from "./users";

export const students = mysqlTable("students", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  nisn: varchar("nisn", { length: 20 }).unique(), // NISN unik nasional — nullable saat soft-delete
  name: varchar("name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["L", "P"]).notNull(),
  religion: mysqlEnum("religion", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"]).notNull().default("Islam"),
  status: mysqlEnum("status", ["Aktif", "Nonaktif"]).default("Aktif").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
