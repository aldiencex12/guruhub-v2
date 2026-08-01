import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔄 Menambahkan role BKTeacher dan Counselor ke enum users...");
  
  try {
    await db.execute(sql`
      ALTER TABLE users 
      MODIFY COLUMN role 
      ENUM('SuperAdmin','SchoolAdmin','Principal','Teacher','HomeroomTeacher','BKTeacher','Counselor','Student') 
      NOT NULL
    `);
    console.log("✅ Berhasil! Role BKTeacher dan Counselor telah ditambahkan.");
  } catch (err: any) {
    if (err.message?.includes("Data truncated") || err.message?.includes("already")) {
      console.log("ℹ️  Role mungkin sudah ada:", err.message);
    } else {
      console.error("❌ Error:", err.message);
    }
  }
  
  process.exit(0);
}

main();
