import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "#db/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "schema.sql");

try {
  const schemaSql = await readFile(schemaPath, "utf8");
  await db.connect();
  await db.query(schemaSql);
  console.log("Database reset.");
} catch (error) {
  console.error("Failed to reset database:", error);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
