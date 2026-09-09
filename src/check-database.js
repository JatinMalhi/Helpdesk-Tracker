import { checkDatabaseConnection, pool } from "./database.js";

try {
  await checkDatabaseConnection();
  console.log("Database connection successful.");
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
