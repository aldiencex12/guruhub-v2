import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding idx_school_id...");
    await db.execute(sql`ALTER TABLE assessment_categories ADD INDEX idx_school_id (school_id)`);
  } catch (e: any) {
    console.log("Index might already exist:", e.message);
  }

  try {
    console.log("Dropping uq_school_category_name...");
    await db.execute(sql`ALTER TABLE assessment_categories DROP INDEX uq_school_category_name`);
  } catch (e: any) {
    console.log("Index might be already dropped:", e.message);
  }

  try {
    console.log("Adding teacher_id...");
    await db.execute(sql`ALTER TABLE assessment_categories ADD COLUMN teacher_id BIGINT UNSIGNED DEFAULT NULL`);
    await db.execute(sql`ALTER TABLE assessment_categories ADD CONSTRAINT fk_ac_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE`);
  } catch (e: any) {
    console.log("Column might already exist:", e.message);
  }

  console.log("Done");
  process.exit(0);
}

main();
