# Fozorewor Mart

Fozorewor Mart is a single-service grocery web app focused on one clean core deliverable: authentication plus a seeded product catalog, deployed from one Render URL.

## Problem Statement

The project needs a clean, presentable main branch with a working core feature that can run consistently across machines and deploy simply on Render.

## Current Scope

- Register with `username`, `email`, and `password`
- Log in with `username or email` and `password`
- Reset a password by email
- Seed grocery categories and products into Postgres
- Expose operational visibility with New Relic, Prometheus, and Grafana
- Serve frontend and backend from one app and one URL

## Distinguishing Features

- Single Render web service deployment for both frontend and backend
- Same-origin auth API calls
- Seeded grocery data stored in Postgres
- Built-in monitoring endpoints and dashboards

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: bcrypt, JSON Web Tokens
- Observability: New Relic, Prometheus, Grafana
- Containerization: Docker, Docker Compose

## Architecture Overview

- `frontend/src`
  React app, auth pages, layout, and browser-side New Relic setup
- `backend/api`
  Express route handlers
- `backend/queries`
  Database access for auth
- `backend/db`
  SQL schema, reset script, seed entrypoint, and product seed data
- `backend/middleware`
  Shared Express middleware used by the active app
- `prometheus` and `grafana`
  Local monitoring configuration

## Core User Flow

1. A user registers with a username, email, and password.
2. The backend stores the account in Postgres and returns a JWT.
3. The user can log in with either username or email.
4. If needed, the user can update their password with the forgot-password flow.

## Deployment

The app is structured as one deployable service. The backend serves the built frontend, so Render can host everything at one URL such as:

`https://fozorewor-mart-capstone.onrender.com/`

## Local Development

Frontend:

```powershell
cd frontend
npm install
npm run build
```

Backend:

```powershell
cd backend
npm install
npm run db:reset
npm run db:seed
npm run dev
```

Docker:

```powershell
docker compose up --build
```

## Database Schema

The current scoped schema includes:

- `users`
- `categories`
- `products`

## ER Diagram

![ER Diagram](backend/db/table-diagram.png)

The DBML source is in [backend/db/schema.dbml](backend/db/schema.dbml).
