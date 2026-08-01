import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { users } from "./users";

export const teachers = mysqlTable("teachers", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  nip: varchar("nip", { length: 18 }), // NIP guru (bisa kosong bagi guru honorer)
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  gender: mysqlEnum("gender", ["L", "P"]).notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_nip").on(table.schoolId, table.nip)
]);
