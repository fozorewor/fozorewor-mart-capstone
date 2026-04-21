import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ordersRouter from "#api/orders";
import productsRouter from "#api/products";
import usersRouter from "#api/users";
import db from "#db/client";
import getUserFromToken from "#middleware/getUserFromToken";
import handlePostgresErrors from "#middleware/handlePostgresErrors";
import {
  getMetrics,
  getMetricsContentType,
  metricsMiddleware,
} from "#metrics";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "../frontend");
const frontendDistDir = path.resolve(__dirname, "../frontend/dist");
const frontendIndexFile = path.join(frontendDistDir, "index.html");

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
app.use(metricsMiddleware);
app.use(getUserFromToken);
app.use("/images", express.static(path.join(frontendDir, "images")));
app.use("/orders", ordersRouter);
app.use("/products", productsRouter);
app.use("/users", usersRouter);
app.use(express.static(frontendDistDir));

app.get("/", (_req, res) => {
  res.sendFile(frontendIndexFile);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/health/db", async (_req, res, next) => {
  try {
    await db.query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/metrics", async (_req, res, next) => {
  try {
    res.set("Content-Type", getMetricsContentType());
    res.send(await getMetrics());
  } catch (error) {
    next(error);
  }
});

app.get(
  /^\/(?!users(?:\/|$)|orders(?:\/|$)|products(?:\/|$)|health(?:\/|$)|metrics(?:\/|$)).*/,
  (_req, res) => {
    res.sendFile(frontendIndexFile);
  },
);

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(handlePostgresErrors);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;
