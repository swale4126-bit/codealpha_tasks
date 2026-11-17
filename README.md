# KoraMarket — Full-Stack E-commerce Platform

> **CodeAlpha Full-Stack Development Internship — Task 1 (Simple E-commerce Store)**

KoraMarket is a full-stack e-commerce web application built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and **PostgreSQL**. It features a complete customer storefront, persistent shopping cart, atomic checkout workflow (Cash on Delivery & Simulated Demo Payment), order tracking, product reviews, and a role-protected Admin Dashboard.

---

## Project Status

Currently completing **Phase 1: Project Charter, Requirements & Architecture**. Full setup, database, API, storefront, admin, and test instructions will be expanded as each phase is completed and verified.

---

## Technology Stack

- **Frontend:** React, Vite, JavaScript (ES6+), Tailwind CSS, React Router, Axios, React Context API
- **Backend:** Node.js (ES Modules), Express.js, JWT, bcrypt, express-validator, Helmet, CORS, Rate Limiting
- **Database:** PostgreSQL 16, `pg` (`node-postgres`), SQL (3NF normalized schema, constraints, indexes, triggers)
- **Tooling:** Git, GitHub, VS Code, ESLint, Prettier

---

## Architecture & Documentation

- [Project Charter](docs/project-charter.md)
- [System Architecture](docs/architecture.md)
- [Database Design & ER Diagram](docs/database-design.md)
- [REST API Documentation](docs/api-documentation.md)

---

## Directory Structure

```text
Simple-E-commerce-Store/
├── client/          # React + Vite + Tailwind frontend
├── server/          # Node.js + Express REST API
├── database/        # PostgreSQL schema.sql, seed.sql, migrations/
├── docs/            # Charter, architecture, database & API documentation
├── .gitignore       # Excludes node_modules, .env files, build artifacts
└── README.md
```

---

## Security & Payment Notice

- **Environment Secrets:** Never commit `.env` files. Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env` for local configuration.
- **Payments:** KoraMarket implements **Cash on Delivery (COD)** and **Simulated Demo Payment (Test Mode)** for internship/educational demonstration. No real payment cards are processed or stored.
