# Docker, Prometheus, and Grafana

This project now runs as a single deployable app. The backend serves the built frontend while continuing to use the Render-hosted Postgres database defined in `backend/.env`.

## Services

- `app`: Express API plus frontend on `http://localhost:3005`
- `prometheus`: metrics scraper on `http://localhost:9090`
- `grafana`: dashboards on `http://localhost:3000`

## Requirements

- Docker Desktop
- Valid `backend/.env` with:
  - `DATABASE_URL`
  - `PORT=3005`
  - `JWT_SECRET`

## Start the stack

```powershell
docker compose up --build
```

## Stop the stack

```powershell
docker compose down
```

## Monitoring

- Prometheus scrapes `app:3005/metrics`
- Grafana is pre-provisioned with:
  - a Prometheus datasource
  - a `Fozorewor Backend Overview` dashboard

Grafana login:

- username: `admin`
- password: `Fullstack`

## Backend metrics

The backend now exposes:

- `GET /metrics`
- Node.js default process metrics
- `http_requests_total`
- `http_request_duration_seconds`

## Notes

- This setup does not create a Postgres container. The app keeps using the external Render database from `backend/.env`.
- The frontend is built into the backend image and served by Express.

## New Relic

New Relic is enabled in this project environment on top of Prometheus/Grafana.

### Backend agent

Add to `backend/.env`:

- `NEW_RELIC_ENABLED=true`
- `NEW_RELIC_LICENSE_KEY=<your_new_relic_license_key>`
- `NEW_RELIC_APP_NAME=fozorewor-mart-backend`
- `NEW_RELIC_LOG_LEVEL=info` (optional)

The backend loads the agent at startup when `NEW_RELIC_ENABLED=true`.

### Frontend browser agent

Add to `frontend/.env`:

- `VITE_NEW_RELIC_ENABLED=true`
- `VITE_NEW_RELIC_ACCOUNT_ID=<account_id>`
- `VITE_NEW_RELIC_TRUST_KEY=<trust_key>` (often same as account id)
- `VITE_NEW_RELIC_AGENT_ID=<agent_id>`
- `VITE_NEW_RELIC_APPLICATION_ID=<application_id>`
- `VITE_NEW_RELIC_BROWSER_LICENSE_KEY=<browser_license_key>`
- `VITE_NEW_RELIC_BEACON=bam.nr-data.net` (optional)
- `VITE_NEW_RELIC_ERROR_BEACON=bam.nr-data.net` (optional)
- `VITE_NEW_RELIC_LOADER_URL=https://js-agent.newrelic.com/nr-loader-spa-current.min.js` (optional)

Get these values from New Relic Browser app settings (copy/paste snippet details).

## Auth KPI Queries

Use these queries to compare the same auth story in Grafana (Prometheus) and New Relic.

### Prometheus / Grafana

- Auth success rate (5m):
  - `100 * (sum(rate(auth_events_total{outcome="success"}[5m])) / clamp_min(sum(rate(auth_events_total[5m])), 1e-9))`
- Auth failure rate (5m):
  - `sum(rate(auth_events_total{outcome="failure"}[5m]))`
- Auth p95 duration:
  - `histogram_quantile(0.95, sum by (le) (rate(auth_operation_duration_seconds_bucket[5m])))`
- Failures by reason:
  - `sum by (action, reason) (rate(auth_events_total{outcome="failure"}[5m]))`

### New Relic (NRQL)

- Backend auth throughput by endpoint:
  - `SELECT rate(count(*), 1 minute) FROM Transaction WHERE appName = 'fozorewor-mart-backend' AND request.uri LIKE '/users/%' FACET request.uri TIMESERIES`
- Backend auth error rate by endpoint:
  - `SELECT percentage(count(*), WHERE error IS true) FROM Transaction WHERE appName = 'fozorewor-mart-backend' AND request.uri LIKE '/users/%' FACET request.uri TIMESERIES`
- Backend auth p95 duration by endpoint:
  - `SELECT percentile(duration, 95) FROM Transaction WHERE appName = 'fozorewor-mart-backend' AND request.uri LIKE '/users/%' FACET request.uri TIMESERIES`
- Frontend page load p95:
  - `SELECT percentile(duration, 95) FROM PageViewTiming FACET pageUrl TIMESERIES`
