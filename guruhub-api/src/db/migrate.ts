import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

console.log("Starting database migration programmatically...");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
});

const db = drizzle(connection);

try {
  // Disable foreign key checks for this migration connection session
  await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
  console.log("Foreign key checks disabled for session.");
  
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Database migration completed successfully!");
  
  // Re-enable foreign key checks
  await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("Foreign key checks re-enabled.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await connection.end();
}

process.exit(0);
