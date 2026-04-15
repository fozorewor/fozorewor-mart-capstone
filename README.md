# Fozorewor Mart

Fozorewor Mart is an online grocery shopping platform built to deliver a fast, convenient, and reliable shopping experience.

## Overview

This web-based application allows users to:

- Browse grocery products
- Manage shopping carts
- Place customer orders

The goal is to make grocery shopping simpler while supporting efficient order processing and delivery management.

## Objective

Develop a scalable, user-centric platform that:

- Simplifies grocery shopping
- Improves customer convenience
- Supports efficient order fulfillment
- Creates a strong foundation for future growth

## Current Scope

- Register with `username`, `email`, and `password`
- Log in with `username or email` and `password`
- Reset a password by email
- Seed grocery categories and products into Postgres
- Expose operational visibility with New Relic, Prometheus, and Grafana

## Core Features

- Secure user registration and login
- Product browsing by category
- Keyword-based product search
- Cart management with quantity updates before checkout
- Order placement with pricing details such as subtotal, tax, and delivery fee
- Order history and order status tracking


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

## Future Enhancements

- Product reviews for verified purchases
- Inventory tracking with real-time stock updates
- Admin dashboard for managing products and orders
- Favorites and "buy again" recommendations
- Secure payment integration for complete checkout

## Expected Outcome

The platform is expected to provide a scalable and efficient solution that:

- Enhances user convenience
- Improves shopping reliability
- Supports long-term platform expansion

## Database Schema

The broader project schema includes:

- `users`
- `categories`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

This schema supports product browsing, cart management, order history, and viewing the details of a single order.

## ER Diagram

![ER Diagram](backend/db/table-diagram.png)
[View DBML Schema](backend/db/schema.dbml)
