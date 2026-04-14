const isNewRelicEnabled = process.env.NEW_RELIC_ENABLED === "true";

if (isNewRelicEnabled) {
  process.env.NEW_RELIC_CONFIG_FILENAME ??= "newrelic.cjs";
  try {
    await import("newrelic");
    console.log("New Relic backend agent enabled.");
  } catch (error) {
    console.error("Failed to initialize New Relic backend agent.", error);
  }
}

const [{ default: app }, { default: db }] = await Promise.all([
  import("#app"),
  import("#db/client"),
]);

const PORT = process.env.PORT ?? 3005;

function getDatabaseConnectionInfo() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      host: "not configured",
      port: "not configured",
      database: "not configured",
      username: "not configured",
    };
  }

  try {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname || "not configured",
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "fozorewor-db",
      username: parsed.username || "fozorewor",
    };
  } catch {
    return {
      host: "invalid DATABASE_URL",
      port: "invalid DATABASE_URL",
      database: "invalid DATABASE_URL",
      username: "invalid DATABASE_URL",
    };
  }
}

await db.connect();

app.listen(PORT, () => {
  const dbInfo = getDatabaseConnectionInfo();
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`;
  console.log(`
============================================================
FOZOREWOR MART SERVER STARTED
============================================================

Base URL: ${baseUrl}

Health Check
  ${baseUrl}/health
  ${baseUrl}/health/db

Database (from DATABASE_URL)
  Host:      ${dbInfo.host}
  Port:      ${dbInfo.port}
  Database:  ${dbInfo.database}
  Username:  ${dbInfo.username}
`);
});
