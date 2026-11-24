# Insignia Crypto Wallet & Admin Management System

A production-grade, full-stack cryptocurrency wallet platform and administrative management portal. Built strictly adhering to the Stoplight cryptocurrency wallet API specification and extended with enterprise administrative controls, atomic peer-to-peer transfers, real-time analytics, biodata profile management, and comprehensive automated test suites.

---

## 📑 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Default Credentials](#default-credentials)
- [Prerequisites](#prerequisites)
- [Database Setup](#1-database-setup-postgresql)
- [Backend Setup](#2-backend-setup-insignia-backend)
- [Frontend Setup](#3-frontend-setup-insignia-frontend)
- [One-Click Launcher (Windows)](#-one-click-launcher-windows)
- [Running Automated Unit Tests](#-running-automated-unit-tests)
- [API Documentation (Swagger)](#-api-documentation-swagger)
- [Live Production Deployment](#-live-production-deployment)

---

## Overview & Architecture

The application is structured as a modular monorepo containing a native Express.js REST API and a modern React Vite frontend dashboard:

- **Backend (`insignia-backend`)**: Native Node.js Express 5 REST API using TypeScript (ESM), PostgreSQL, and Prisma ORM 6. Features atomic database transactions (`Prisma.$transaction`), salted bcrypt password hashing, JWT authentication, and Swagger OpenAPI documentation.
- **Frontend (`insignia-frontend`)**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query (React Query 5), React Hook Form, SweetAlert2, and Lucide icons. Supports both **Live API Mode** and a mock in-browser **Demo Mode** via Mock Service Worker (MSW).

---

## Key Features

- **P2P Wallet Transfers:** Instant, atomic wallet unit transfers with balance validation, self-transfer prevention, and SweetAlert2 confirmation modals.
- **Admin Management Portal:**
  - Real-time aggregate statistics: `Total Users`, `Active Users`, and `Total Wallet Balance` across the ecosystem.
  - User Directory with search, pagination, status filtering, and inline profile editing.
  - **"Register New User"** modal with international phone masking, date picker, and live query cache invalidation.
  - Admin-directed top-ups and balance transfers.
- **Counterparty & Volume Analytics:**
  - Counterparty ranking via `GET /top_transactions_per_user`.
  - Top 10 sender leaderboard via `GET /top_users`.
  - Searchable, filterable, and paginated transaction history (`/transactions`).
- **Profile & Security:**
  - Custom biodata management (Full Name, Phone, Date of Birth, Gender, Residential Address, Avatar).
  - Secure password changes with bcrypt verification.
  - Masked currency display with thousand separators.
- **100% Automated Test Coverage:**
  - 36 backend API unit tests organized across 8 modular domain files.
  - 15 frontend component and integration tests.

---

## Project Structure

```text
insignia-test/
├── insignia-backend/                 # Node.js + Express 5 REST API
│   ├── prisma/
│   │   ├── schema.prisma             # PostgreSQL schema (users, admins, transfers, topups)
│   │   └── seed.ts                   # Initial database seeder
│   ├── src/
│   │   ├── app.ts                    # Express app factory & middleware configuration
│   │   ├── main.ts                   # Server bootstrap & port listener
│   │   ├── routes/                   # Route handlers (admin, user, wallet)
│   │   ├── services/                 # Business logic & Prisma database operations
│   │   └── swagger.ts                # Swagger OpenAPI 3.0 configuration
│   ├── test/                         # Modular Vitest test suite (8 domain files, 36 tests)
│   └── .env                          # Backend environment variables
│
├── insignia-frontend/                # React 18 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── features/                 # Modular feature domains (auth, overview, users, transactions)
│   │   ├── components/               # Shared UI elements (layout, modals, form controls)
│   │   ├── services/                 # Axios API clients & TanStack query definitions
│   │   └── mocks/                    # MSW handlers for standalone browser demo mode
│   └── .env                          # Frontend environment variables
│
├── start.bat                         # Quick launcher for Windows (starts both services)
├── run.bat                           # Launcher script (frees port 3001 & runs dev servers)
├── ASYNC_IMPLEMENTATIONS.md          # Technical documentation on async design patterns
└── README.md                         # Project documentation (this file)
```

---

## Default Credentials

### Administrator Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator (Access to Admin Dashboard, User Directory, Top-Up grants, and Analytics)

### Demo User Accounts
- **Username:** `andre` | **Password:** `password123`
- **Username:** `azra`  | **Password:** `password123`
- *New users can also be registered at any time via the registration page or the Admin Users modal.*

---

## Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js:** `v18.x` or `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm:** `v9.x` or higher
- **PostgreSQL:** `v14.x` or higher running locally or in Docker ([Download PostgreSQL](https://www.postgresql.org/))
- **Git**

---

## 1. Database Setup (PostgreSQL)

1. **Start PostgreSQL service** on your machine (default port: `5432`).
2. **Create the database** named `crypto-wallet`:
   ```sql
   CREATE DATABASE "crypto-wallet";
   ```
3. Open `insignia-backend/.env` and update `DATABASE_URL` with your local PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/crypto-wallet?schema=public"
   PORT=3001
   JWT_SECRET="insignia-assignment-secret-key-2026"
   ```
4. Synchronize the schema and generate the Prisma client:
   ```powershell
   cd insignia-backend
   npm install
   npm run prisma:generate
   npm run prisma:push
   ```
5. *(Optional but recommended)* Seed initial demo users and transactions:
   ```powershell
   npm run prisma:seed
   ```

---

## 2. Backend Setup (`insignia-backend`)

1. Open a terminal and navigate to the backend folder:
   ```powershell
   cd insignia-backend
   ```
2. Ensure dependencies are installed:
   ```powershell
   npm install
   ```
3. Start the development server (runs with hot reload via `tsx`):
   ```powershell
   npm run start:dev
   ```
4. The backend API will be available at:
   - **Base API URL:** `http://localhost:3001`
   - **Swagger OpenAPI Documentation:** `http://localhost:3001/docs`

---

## 3. Frontend Setup (`insignia-frontend`)

1. Open a second terminal and navigate to the frontend folder:
   ```powershell
   cd insignia-frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Verify your `insignia-frontend/.env` configuration:
   ```env
   # Set to 'live' to connect to the backend, or 'demo' for in-browser mock simulation
   VITE_DATA_MODE=live
   VITE_API_BASE_URL=http://localhost:3001
   VITE_AUTH_LOGIN_PATH=/admin/login
   VITE_TRANSACTIONS_PATH=/transactions
   ```
4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
5. Open your browser and navigate to:
   - **Web App:** `http://localhost:5173`

---

## ⚡ One-Click Launcher (Windows)

For convenience on Windows machines, you can launch both backend and frontend services simultaneously:

1. Double-click [`start.bat`](file:///d:/1-%20Projects/insignia-test/start.bat) in the project root directory.
2. The script will:
   - Automatically free port `3001` if it is occupied by an orphaned process.
   - Launch the Node.js Express Backend API on port `3001` in a dedicated terminal.
   - Launch the React Vite Frontend on port `5173` in a dedicated terminal.
   - Display clickable links to the dashboard, API, and Swagger docs.

---

## 🧪 Running Automated Unit Tests

Both the frontend and backend have comprehensive unit test suites powered by [Vitest](https://vitest.dev/).

### Backend Unit Tests (36 Tests across 8 Domain Files)

Navigate to the `insignia-backend` folder:
```powershell
cd insignia-backend
npm test
```

#### Run Specific Test Domains:
```powershell
npx vitest run test/auth.test.ts               # Authentication & login aliases (3 tests)
npx vitest run test/user-registration.test.ts  # User registration & username availability (6 tests)
npx vitest run test/user-profile.test.ts       # Profile retrieval & password changes (5 tests)
npx vitest run test/wallet-transfer.test.ts    # Balance, topup restriction & atomic transfers (7 tests)
npx vitest run test/transactions.test.ts       # Top transactions, top users & pagination (3 tests)
npx vitest run test/admin-users.test.ts        # Admin directory, aggregate stats & search (5 tests)
npx vitest run test/admin-operations.test.ts   # Admin balance adjustments & transfers (4 tests)
npx vitest run test/app.test.ts                # General routing, Swagger redirect & 404 (3 tests)
```

#### Interactive Watch Mode:
```powershell
npm run test:watch
```

---

### Frontend Unit Tests (15 Tests across 4 Feature Suites)

Navigate to the `insignia-frontend` folder:
```powershell
cd insignia-frontend
npm test
```

---

### Run All Tests Together from Root:

**In PowerShell:**
```powershell
cd insignia-backend; npm test; cd ../insignia-frontend; npm test; cd ..
```

**In Command Prompt (CMD) / Bash:**
```bash
cd insignia-backend && npm test && cd ../insignia-frontend && npm test && cd ..
```

---

## 📖 API Documentation (Swagger)

Interactive Swagger OpenAPI 3.0 documentation is automatically served by the backend:
- Local URL: **`http://localhost:3001/docs`**
- Root redirect: Visiting `http://localhost:3001/` automatically redirects to `/docs`.

To authorize requests in Swagger UI:
1. Call `POST /admin/login` with `{"username": "admin", "password": "admin123"}`.
2. Copy the returned `token`.
3. Click the green **Authorize 🔓** button at the top right of Swagger UI.
4. Enter the token into the dialog and submit.

---

## 🌐 Live Production Deployment

- **Production Frontend:** [http://djayamakmur.net/insignia/](http://djayamakmur.net/insignia/)
- **Production Server:** `103.126.117.52`
- **Process Manager:** PM2 (Service: `insignia-backend`)
- **Web Server:** Nginx reverse proxy serving static frontend builds and proxying `/api` & `/docs` to PM2.
