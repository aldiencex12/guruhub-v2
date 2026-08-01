import { mysqlTable, serial, varchar, text, mysqlEnum, timestamp, longtext } from "drizzle-orm/mysql-core";

export const schools = mysqlTable("schools", {
  id: serial("id").primaryKey(),
  npsn: varchar("npsn", { length: 8 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  foundationName: varchar("foundation_name", { length: 255 }),
  regionalName: varchar("regional_name", { length: 255 }),
  accreditation: varchar("accreditation", { length: 100 }),
  level: mysqlEnum("level", ["SMP", "SMA"]).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: longtext("logo_url"),
  kopSuratUrl: longtext("kop_surat_url"),
  principalName: varchar("principal_name", { length: 255 }),
  principalNip: varchar("principal_nip", { length: 50 }),
  status: mysqlEnum("status", ["Negeri", "Swasta"]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
