import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const authEventsTotal = new client.Counter({
  name: "auth_events_total",
  help: "Total number of authentication events",
  labelNames: ["action", "outcome", "reason"],
  registers: [register],
});

const authOperationDurationSeconds = new client.Histogram({
  name: "auth_operation_duration_seconds",
  help: "Authentication operation duration in seconds",
  labelNames: ["action", "outcome"],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const route =
      [req.baseUrl, req.route?.path].filter(Boolean).join("") ||
      req.path ||
      "unknown";
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}

export async function getMetrics() {
  return register.metrics();
}

export function getMetricsContentType() {
  return register.contentType;
}

function sanitizeLabelValue(value, fallback) {
  if (!value) return fallback;
  return String(value).toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

export function recordAuthEvent({ action, outcome, reason = "none", durationSeconds }) {
  const safeAction = sanitizeLabelValue(action, "unknown");
  const safeOutcome = sanitizeLabelValue(outcome, "unknown");
  const safeReason = sanitizeLabelValue(reason, "none");

  authEventsTotal.inc({
    action: safeAction,
    outcome: safeOutcome,
    reason: safeReason,
  });

  if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds)) {
    authOperationDurationSeconds.observe(
      { action: safeAction, outcome: safeOutcome },
      durationSeconds,
    );
  }
}
