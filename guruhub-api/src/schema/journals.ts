import { mysqlTable, serial, varchar, text, date, timestamp, bigint } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { subjectTeachers } from "./subjects";

export const journals = mysqlTable("journals", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull().references(() => schools.id, { onDelete: "cascade" }),
  subjectTeacherId: bigint("subject_teacher_id", { mode: "number", unsigned: true }).notNull().references(() => subjectTeachers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(), // Materi pembelajaran
  activities: text("activities").notNull(), // Kegiatan KBM
  notes: text("notes"), // Hambatan, siswa tidak masuk, dll.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
