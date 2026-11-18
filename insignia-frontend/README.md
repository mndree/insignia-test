# Insignia Cryptocurrency Wallet Admin Dashboard

A modern, responsive, production-ready cryptocurrency wallet admin dashboard built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **TanStack Query**.

---

## 🚀 Key Features

- **Responsive Visual Layout:** Clean pale-gray canvas (`#f8fafc`), white content cards, deep navy text (`#0f172a`), indigo primary navigation & actions (`#4f46e5`), mint green incoming transfers (`#10b981`), and muted red outgoing transfers (`#f43f5e`).
- **Two Explicit Data Modes:**
  - **Demo Mode (Default):** In-browser simulation via [Mock Service Worker (MSW)](https://mswjs.io/) providing instant, stateful mock data, realistic transactions, reactive balances, and preconfigured demo credentials.
  - **Live API Mode:** Connects directly to the documented Stoplight backend or a real REST service, strictly using documented endpoints and providing explicit unavailable fallback notices when extended endpoints are unconfigured.
- **Wallet Overview (`/`):**
  - Displays current wallet balance formatted in **wallet units** (as no currency is specified in the Stoplight backend specification).
  - Quick top-up form with preset buttons (`+100`, `+500`, `+1,000`, `+5,000`) and boundary validation (`0 < amount < 10,000,000`).
  - Transfer form with recipient check, available balance verification, duplicate submission prevention, and confirmation dialog.
  - Visual charts showing incoming vs. outgoing flow and daily volume distribution.
- **Paginated Transactions History (`/transactions`):**
  - Full paginated transaction history table (10, 25, 50 items per page).
  - Debounced search by counterparty username or transaction ID.
  - Direction filters: All, Incoming Only (`+`), Outgoing Only (`-`).
  - Date range filtering (`dateFrom`, `dateTo`).
  - Full query state reflected in URL search parameters.
  - Reset to page 1 automatically on filter adjustments.
- **Top Transactions (`/top-transactions`):**
  - Dedicated view utilizing `GET /top_transactions_per_user`.
  - Up to 10 transfers sorted by absolute value descending, including both signed incoming and outgoing transfers.
- **Top Users Leaderboard (`/top-users`):**
  - Dedicated leaderboard utilizing `GET /top_users`.
  - Up to 10 top senders ranked strictly by aggregated outgoing transfer volume.
  - Highlights the authenticated user when present in the rankings.
- **Authentication & Security:**
  - Username & password login form with show/hide password toggle.
  - Documented `POST /user` token registration workflow on `/register`.
  - Automatic 401 interceptor clearing session and query caches.
  - In-memory token management with scoped `sessionStorage` fallback.

---

## 🔑 Demo Credentials

When running in **Demo Mode** (`VITE_DATA_MODE=demo`):

| Username | Password | Role / Access | Initial Balance |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin123`** | Admin Wallet | 14,250 units |
| `azra` | `password123` | Counterparty | 8,500 units |
| `raka` | `password123` | Counterparty | 12,000 units |

> **Tip:** On the login page, click **"Auto-fill demo credentials"** to populate the form instantly.

---

## 🛠️ Tech Stack

- **Framework:** React 18 & TypeScript (Vite 5)
- **Routing:** React Router DOM 6
- **Styling:** Tailwind CSS 3
- **Server State:** TanStack Query 5 (React Query)
- **HTTP Client:** Axios 1.7
- **Forms & Validation:** React Hook Form 7 + Zod 3
- **Charts:** Recharts 2.15
- **Icons:** Lucide React
- **Mocking:** Mock Service Worker (MSW) 2.7
- **Testing:** Vitest 2.1 + React Testing Library + JSDOM

---

## 📋 Available Commands

Navigate to `insignia-frontend`:

```bash
cd insignia-frontend
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Tests
```bash
npm test
```

### 4. Run Linter
```bash
npm run lint
```

### 5. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🔌 API Integration & Contract Distinction

### 1. Documented Stoplight API Endpoints
These 6 endpoints are explicitly part of the supplied Stoplight specification:

| Method | Endpoint | Auth Header | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/user` | None | Register unique username, returns `{ "token": "..." }` |
| `GET` | `/balance` | `Authorization: <token>` | Returns current wallet balance `{ "balance": 12450 }` |
| `POST` | `/topup` | `Authorization: <token>` | Adds amount to user balance (`0 < amount < 10,000,000`) |
| `POST` | `/transfer` | `Authorization: <token>` | Deducts from sender and credits recipient |
| `GET` | `/top_transactions_per_user` | `Authorization: <token>` | Top 10 transfers sorted by absolute value |
| `GET` | `/top_users` | `Authorization: <token>` | Top 10 users ranked by outgoing transfer sum |

*Notice on Header:* Per the Stoplight contract, the token is sent directly as `Authorization: <token>` (no mandatory `Bearer` prefix).

### 2. Proposed Extended Contracts (Technical Test Gaps)
The assignment requires features (username/password login, paginated transaction history, search/filter, and historical charts) not supported by the minimal 6-endpoint Stoplight specification. We define proposed integration contracts in [`src/services/api/proposedContracts.ts`](src/services/api/proposedContracts.ts):

- **`POST /auth/login` (or `/admin/login`):**
  - **Request Body:** `{ "username": "admin", "password": "..." }`
  - **Response (200):** `{ "token": "...", "user": { "username": "admin" } }`
- **`GET /transactions`:**
  - **Query Parameters:** `page`, `pageSize`, `search`, `direction` (`all` \| `incoming` \| `outgoing`), `dateFrom`, `dateTo`.
  - **Response (200):** `{ "items": [{ "id": "TXN-001", "username": "azra", "amount": -250, "created_at": "..." }], "page": 1, "pageSize": 10, "total": 42 }`

---

## ⚙️ Environment Configuration

Refer to [`.env.example`](.env.example):

```env
# Application Data Mode: 'demo' or 'live'
VITE_DATA_MODE=demo

# Backend API Base URL (empty for relative path, or e.g. http://localhost:3000)
VITE_API_BASE_URL=

# Extended Authentication Endpoint (e.g. /auth/login or /admin/login)
VITE_AUTH_LOGIN_PATH=/auth/login

# Extended Paginated Transactions Endpoint (e.g. /transactions)
VITE_TRANSACTIONS_PATH=/transactions
```

### Switching to Live Mode:
1. Start your backend API (e.g., in `insignia-backend`, run `npm run start:dev` on port 3000).
2. Set in `.env`:
   ```env
   VITE_DATA_MODE=live
   VITE_API_BASE_URL=http://localhost:3000
   VITE_AUTH_LOGIN_PATH=/admin/login
   VITE_TRANSACTIONS_PATH=
   ```
3. Restart Vite (`npm run dev`). When `VITE_TRANSACTIONS_PATH` is left empty in live mode, the UI gracefully renders the documented unavailable state rather than failing silently or fabricating mock data.

---

## 🔒 Session Storage & Security Tradeoff

- By default, authentication state is maintained in React in-memory state.
- For convenience during technical evaluation across page reloads, session credentials mirror to `sessionStorage`.
- **Security Tradeoff:** `sessionStorage` is strictly scoped to the active browser tab and is destroyed when the tab is closed. In production banking/crypto environments, HttpOnly, SameSite cookies or short-lived in-memory tokens with refresh token rotation are advised.

---

## 📁 Project Architecture

```
src/
├── app/                  # Configuration, router, and query providers
├── components/
│   ├── layout/           # Sidebar, Header, DashboardLayout
│   └── ui/               # Button, Input, Modal, Card, Badge, Pagination, etc.
├── features/
│   ├── auth/             # Login, Register, ProtectedRoute, schemas, tests
│   ├── overview/         # BalanceCard, TopupModal, TransferModal, Charts, tests
│   ├── transactions/     # Filters, Table, Pagination, URL sync, tests
│   ├── top-transactions/ # GET /top_transactions_per_user page
│   └── top-users/        # GET /top_users leaderboard page
├── services/
│   └── api/              # Axios client, endpoints, proposed contracts
├── mocks/                # MSW browser worker, Node test server, handlers, fixtures
├── hooks/                # useDebounce, useToast
├── utils/                # formatters, cn
├── test/                 # Vitest setup, polyfills, test utilities
└── types/                # TypeScript DTOs and view models
```
