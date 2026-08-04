import { db } from "./index";
import { sql } from "drizzle-orm";

async function createTable() {
  console.log("Creating table discipline_counseling_schedules if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discipline_counseling_schedules (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      school_id bigint unsigned NOT NULL,
      student_id bigint unsigned NOT NULL,
      academic_year_id bigint unsigned DEFAULT NULL,
      task_type varchar(255) NOT NULL,
      schedule_date date NOT NULL,
      schedule_time varchar(50) DEFAULT NULL,
      location varchar(255) DEFAULT NULL,
      counselor_name varchar(255) DEFAULT NULL,
      notes text DEFAULT NULL,
      status enum('BELUM','SUDAH') NOT NULL DEFAULT 'BELUM',
      cumulative_points int DEFAULT 0,
      deleted_at timestamp NULL DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_counsel_sch_student (school_id, student_id),
      CONSTRAINT fk_counsel_sch_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
      CONSTRAINT fk_counsel_sch_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✅ Table discipline_counseling_schedules successfully created!");
  process.exit(0);
}

createTable().catch((err) => {
  console.error("❌ Error creating table:", err);
  process.exit(1);
});
