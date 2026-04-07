import cors from "cors";
import express from "express";
import morgan from "morgan";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "#db/client";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const landingPagePath = path.resolve(__dirname, "../frontend/fozorewor.html");

const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin,
        }
      : undefined,
  ),
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/", async (_req, res, next) => {
  try {
    const landingPage = await readFile(landingPagePath, "utf8");
    res.type("html").send(landingPage);
  } catch (error) {
    next(error);
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/hello", (_req, res) => {
  res.status(200).json({ message: "Hello World" });
});

app.get("/health/db", async (_req, res, next) => {
  try {
    await db.query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;
