import { mysqlTable, serial, varchar, mysqlEnum, timestamp, bigint, uniqueIndex, index, text, int, date, time, boolean, foreignKey } from "drizzle-orm/mysql-core";
import { schools } from "./schools";
import { students } from "./students";
import { classes } from "./classes";
import { academicYears } from "./academicYears";
import { users } from "./users";
import { teachers } from "./teachers";

// 1. Kategori Disiplin (Discipline Categories) - Supports Violations & Rewards
export const disciplineCategories = mysqlTable("discipline_categories", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["VIOLATION", "REWARD"]).notNull(),
  description: text("description"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_discipline_cat_code").on(table.schoolId, table.code, table.deletedAt),
  foreignKey({
    name: "fk_cat_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade")
]);

// 2. Tipe Aturan Pelanggaran/Penghargaan (Discipline Types)
export const disciplineTypes = mysqlTable("discipline_types", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultPoints: int("default_points").default(5).notNull(),
  description: text("description"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_discipline_type_code").on(table.schoolId, table.code, table.deletedAt),
  index("idx_discipline_types_category").on(table.schoolId, table.categoryId),
  foreignKey({
    name: "fk_type_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_type_category",
    columns: [table.categoryId],
    foreignColumns: [disciplineCategories.id]
  }).onDelete("cascade")
]);

// 3. Kebijakan Disiplin Sekolah (Discipline Policies)
export const disciplinePolicies = mysqlTable("discipline_policies", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  pointResetCycle: mysqlEnum("point_reset_cycle", ["ACADEMIC_YEAR", "SEMESTER", "NEVER"]).default("ACADEMIC_YEAR").notNull(),
  maxActivePoints: int("max_active_points").default(100).notNull(),
  autoSanctionEnabled: boolean("auto_sanction_enabled").default(true).notNull(),
  carryForwardPercentage: int("carry_forward_percentage").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_school_policy").on(table.schoolId),
  foreignKey({
    name: "fk_policy_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade")
]);

// 4. Insiden Disiplin (Discipline Incidents)
export const disciplineIncidents = mysqlTable("discipline_incidents", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  reporterUserId: bigint("reporter_user_id", { mode: "number", unsigned: true }).notNull(),
  handlerTeacherId: bigint("handler_teacher_id", { mode: "number", unsigned: true }),
  incidentDate: date("incident_date").notNull(),
  incidentTime: time("incident_time"),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CANCELLED", "RESOLVED"]).default("DRAFT").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_incidents_reporter").on(table.schoolId, table.reporterUserId),
  index("idx_incidents_handler").on(table.schoolId, table.handlerTeacherId),
  index("idx_incidents_status").on(table.schoolId, table.status),
  index("idx_incidents_date").on(table.schoolId, table.incidentDate),
  foreignKey({
    name: "fk_inc_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_reporter",
    columns: [table.reporterUserId],
    foreignColumns: [users.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_handler",
    columns: [table.handlerTeacherId],
    foreignColumns: [teachers.id]
  }).onDelete("set null")
]);

// 5. Hubungan Insiden, Siswa, dan Tipe Pelanggaran/Penghargaan (Discipline Incident Students)
export const disciplineIncidentStudents = mysqlTable("discipline_incident_students", {
  id: serial("id").primaryKey(),
  incidentId: bigint("incident_id", { mode: "number", unsigned: true }).notNull(),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull(),
  classId: bigint("class_id", { mode: "number", unsigned: true }).notNull(),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull(),
  disciplineTypeId: bigint("discipline_type_id", { mode: "number", unsigned: true }).notNull(),
  pointSnapshot: int("point_snapshot").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_inc_std_incident").on(table.incidentId),
  index("idx_inc_std_student").on(table.studentId, table.academicYearId),
  index("idx_inc_std_class").on(table.classId),
  index("idx_inc_std_type").on(table.disciplineTypeId),
  foreignKey({
    name: "fk_inc_std_incident",
    columns: [table.incidentId],
    foreignColumns: [disciplineIncidents.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_std_student",
    columns: [table.studentId],
    foreignColumns: [students.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_std_class",
    columns: [table.classId],
    foreignColumns: [classes.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_std_year",
    columns: [table.academicYearId],
    foreignColumns: [academicYears.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_inc_std_type",
    columns: [table.disciplineTypeId],
    foreignColumns: [disciplineTypes.id]
  }).onDelete("cascade")
]);

// 6. Saksi Insiden Disiplin (Discipline Incident Witnesses)
export const disciplineIncidentWitnesses = mysqlTable("discipline_incident_witnesses", {
  id: serial("id").primaryKey(),
  incidentId: bigint("incident_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  witnessName: varchar("witness_name", { length: 255 }),
  witnessRole: mysqlEnum("witness_role", ["TEACHER", "STUDENT", "STAFF", "OTHER"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_witness_incident").on(table.incidentId),
  foreignKey({
    name: "fk_witness_incident",
    columns: [table.incidentId],
    foreignColumns: [disciplineIncidents.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_witness_user",
    columns: [table.userId],
    foreignColumns: [users.id]
  }).onDelete("set null")
]);

// 7. Lampiran Bukti Insiden (Discipline Incident Attachments)
export const disciplineIncidentAttachments = mysqlTable("discipline_incident_attachments", {
  id: serial("id").primaryKey(),
  incidentId: bigint("incident_id", { mode: "number", unsigned: true }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileType: mysqlEnum("file_type", ["IMAGE", "PDF", "VIDEO"]).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: int("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attachment_incident").on(table.incidentId),
  foreignKey({
    name: "fk_attach_incident",
    columns: [table.incidentId],
    foreignColumns: [disciplineIncidents.id]
  }).onDelete("cascade")
]);

// 8. Ambang Batas & Rule Sanksi (Discipline Sanction Thresholds)
export const disciplineSanctionThresholds = mysqlTable("discipline_sanction_thresholds", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  minPoints: int("min_points").notNull(),
  sanctionName: varchar("sanction_name", { length: 255 }).notNull(),
  actionRequired: varchar("action_required", { length: 100 }).notNull(),
  description: text("description"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_thresholds_school").on(table.schoolId, table.minPoints),
  foreignKey({
    name: "fk_threshold_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade")
]);

// 9. Riwayat Sanksi Resmi Siswa (Discipline Sanction Logs)
export const disciplineSanctionLogs = mysqlTable("discipline_sanction_logs", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull(),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull(),
  thresholdId: bigint("threshold_id", { mode: "number", unsigned: true }),
  issuedByTeacherId: bigint("issued_by_teacher_id", { mode: "number", unsigned: true }).notNull(),
  cumulativePoints: int("cumulative_points").notNull(),
  sanctionType: varchar("sanction_type", { length: 100 }).notNull(),
  documentUrl: varchar("document_url", { length: 500 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["PENDING", "ACTIVE", "COMPLETED", "REVOKED"]).default("PENDING").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_sanctions_student").on(table.schoolId, table.studentId, table.academicYearId),
  foreignKey({
    name: "fk_sanct_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_sanct_student",
    columns: [table.studentId],
    foreignColumns: [students.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_sanct_year",
    columns: [table.academicYearId],
    foreignColumns: [academicYears.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_sanct_threshold",
    columns: [table.thresholdId],
    foreignColumns: [disciplineSanctionThresholds.id]
  }).onDelete("set null"),
  foreignKey({
    name: "fk_sanct_teacher",
    columns: [table.issuedByTeacherId],
    foreignColumns: [teachers.id]
  }).onDelete("cascade")
]);

// 10. Keputusan & Override Rapat Pleno Kenaikan Kelas (Discipline Pleno Decisions)
export const disciplinePlenoDecisions = mysqlTable("discipline_pleno_decisions", {
  id: serial("id").primaryKey(),
  schoolId: bigint("school_id", { mode: "number", unsigned: true }).notNull(),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull(),
  academicYearId: bigint("academic_year_id", { mode: "number", unsigned: true }).notNull(),
  systemRecommendation: mysqlEnum("system_recommendation", ["NAIK_KELAS", "PEMBINAAN_BASECAMP"]).notNull(),
  finalDecision: mysqlEnum("final_decision", ["NAIK_KELAS", "PEMBINAAN_BASECAMP"]).notNull(),
  isOverridden: boolean("is_overridden").default(false).notNull(),
  unfulfilledSubjectsCount: int("unfulfilled_subjects_count").default(0),
  academicNotes: text("academic_notes"),
  attendanceNotes: text("attendance_notes"),
  disciplineNotes: text("discipline_notes"),
  overrideReason: text("override_reason"),
  decidedByUserId: bigint("decided_by_user_id", { mode: "number", unsigned: true }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("uq_pleno_std_year").on(table.schoolId, table.studentId, table.academicYearId),
  index("idx_pleno_school_std").on(table.schoolId, table.studentId),
  foreignKey({
    name: "fk_pleno_school",
    columns: [table.schoolId],
    foreignColumns: [schools.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_pleno_student",
    columns: [table.studentId],
    foreignColumns: [students.id]
  }).onDelete("cascade"),
  foreignKey({
    name: "fk_pleno_year",
    columns: [table.academicYearId],
    foreignColumns: [academicYears.id]
  }).onDelete("cascade")
]);
