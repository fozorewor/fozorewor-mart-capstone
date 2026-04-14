import db from "#db/client";
import { runSeed } from "./data/index.js";

await db.connect();
await runSeed();
await db.end();
console.log("🌱 Database seeded.");
