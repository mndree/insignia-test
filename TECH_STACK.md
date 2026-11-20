# Insignia Wallet — Technology Stack & Tools Architecture

Comprehensive reference of all frameworks, libraries, runtime environments, and infrastructure tools powering the **Insignia Wallet** cryptocurrency dashboard and backend API.

---

## 1. Frontend Architecture (`insignia-frontend`)

A modern, responsive Single Page Application (SPA) built with React 18 and TypeScript, bundled with Vite and styled with Tailwind CSS.

| Category | Technology / Library | Version | Purpose & Architectural Role |
| :--- | :--- | :--- | :--- |
| **Core Framework** | **React** | `^18.3.1` | Component-based UI library providing reactive state management and hooks. |
| **Language** | **TypeScript** | `^5.6.3` | End-to-end static typing, interface contracts, and type safety across all components. |
| **Build Tool & Bundler** | **Vite** | `^5.4.11` | ESM-native dev server with Hot Module Replacement (HMR) and optimized Rollup production builds. |
| **Routing** | **React Router DOM** | `^6.28.1` | Client-side routing, protected routes, dynamic parameter matching, and configurable subpath basename (`/insignia`). |
| **Data Fetching & Cache** | **TanStack Query (React Query)** | `^5.62.7` | Asynchronous server-state management, automated background refetching, request deduplication, and cache invalidation. |
| **HTTP Client** | **Axios** | `^1.7.9` | Promise-based HTTP client featuring interceptors for Bearer auth token injection and IPv4/127.0.0.1 auto-fallback. |
| **Form Management** | **React Hook Form** | `^7.54.2` | High-performance uncontrolled form state management minimizing unnecessary component re-renders. |
| **Schema Validation** | **Zod** + **@hookform/resolvers** | `^3.24.1` / `^3.9.1` | Type-safe schema validation ensuring input integrity before form submission. |
| **Styling & Design System** | **Tailwind CSS** | `^3.4.17` | Utility-first responsive CSS framework with customized brand color palettes. |
| **CSS Preprocessing** | **PostCSS** + **Autoprefixer** | `^8.4.49` / `^10.4.20` | Vendor prefixing and modern CSS transformation pipeline. |
| **Class Utilities** | **clsx** + **tailwind-merge** | `^2.1.1` / `^2.5.5` | Dynamic conditional class string composition without style precedence conflicts. |
| **Iconography** | **Lucide React** | `^0.468.0` | Accessible, tree-shakeable SVG icon collection. |
| **Data Visualization** | **Recharts** | `^2.15.0` | Declarative SVG chart library for 30-day transaction history, analytics, and balance distributions. |
| **API Mocking** | **MSW (Mock Service Worker)** | `^2.7.0` | Intercepts HTTP requests at network level for full offline client-side simulation (Demo Data Mode). |
| **Unit & Integration Testing** | **Vitest** | `^2.1.8` | Vite-native unit test runner with Jest-compatible test APIs. |
| **Component Testing** | **Testing Library (React & Jest-DOM)** | `^16.1.0` / `^6.6.3` | User-centric component testing simulating realistic DOM interactions. |
| **Test Environment** | **JSDOM** | `^25.0.1` | Pure-JavaScript DOM implementation for headless Node.js testing. |
| **Code Quality** | **ESLint** | `^8.57.1` | Linter enforcing React hooks rules and code standards. |

---

## 2. Backend Architecture (`insignia-backend`)

An enterprise-grade, modular RESTful API built on the NestJS framework with PostgreSQL persistence via Prisma ORM.

| Category | Technology / Library | Version | Purpose & Architectural Role |
| :--- | :--- | :--- | :--- |
| **Core Framework** | **NestJS** | `^12.0.1` | Progressive Node.js framework utilizing Controllers, Services, Dependency Injection, and Modules. |
| **HTTP Platform** | **Express** (`@nestjs/platform-express`) | `^12.0.1` | Fast, minimalist web server engine powering NestJS endpoints with JSON and form-data payload limits. |
| **Language & Module System** | **TypeScript** (Node.js ESM) | `^6.0.2` | Strict TypeScript with native ECMAScript Modules (`"type": "module"`). |
| **Database ORM** | **Prisma ORM** (`@prisma/client`) | `^6.19.3` | Auto-generated type-safe database client, declarative schema modeling, and relational migrations. |
| **API Documentation** | **Swagger / OpenAPI** (`@nestjs/swagger`) | `^12.1.2` | Interactive Swagger OpenAPI documentation and testing sandbox (`/docs` and `/api/docs`). |
| **Validation & DTOs** | **class-validator** + **class-transformer** | `^0.15.1` / `^0.5.1` | Declarative validation decorators on DTOs, stripping non-whitelisted properties and coercing types. |
| **Authentication & Tokens** | **@nestjs/jwt** + **jsonwebtoken** | `^12.0.5` / `^9.0.3` | JSON Web Token (JWT) signing, cryptographic verification, and Bearer token security guards. |
| **Password Security** | **bcryptjs** | `^3.0.3` | Salt-based password hashing for admin profiles and user sign-in credentials. |
| **Environment Configuration** | **@nestjs/config** | `^12.1.1` | Centralized environment variable loading and validation from `.env`. |
| **Reactive Programming** | **RxJS** | `^7.8.1` | Reactive event stream handling and asynchronous interceptors. |
| **Script Execution** | **tsx** | `^4.23.15` | Fast TypeScript execution for database seeding scripts (`seed.ts`) and smoke tests without prior build. |
| **High-Speed Linting** | **oxlint** | `^1.58.0` | Ultra-fast Rust-based static code analyzer. |
| **Code Formatting** | **Prettier** | `^3.4.2` | Opinionated code formatter enforcing consistent syntax layout. |
| **Testing** | **Vitest** + **Supertest** | `^4.1.2` / `^7.0.0` | High-performance test runner for e2e API testing and controller unit tests. |

---

## 3. Infrastructure & Production Environment

Production deployment configuration running on Ubuntu Linux at `djayamakmur.net`.

| Component | Technology | Configuration & Role |
| :--- | :--- | :--- |
| **Operating System** | **Ubuntu 24.04 LTS (Noble Numbat)** | Linux server operating system hosting production workloads. |
| **Runtime Engine** | **Node.js v22.23 (LTS)** | Production JavaScript/TypeScript execution environment. |
| **Database Server** | **PostgreSQL 16** | Relational database hosting `insignia_wallet` with ACID transaction guarantees, indices, and SCRAM-SHA-256 auth. |
| **Reverse Proxy & Web Server** | **Nginx 1.24** | Handles HTTP/2, SSL/TLS termination, static asset compression, and reverse proxy routing for `/insignia` and `/insignia/api`. |
| **Process Manager** | **PM2** | Manages `insignia-backend` background service with automatic process monitoring, zero-downtime reloads, and log retention. |
| **SSL / TLS Certificate** | **Let's Encrypt (Certbot)** | Automated cryptographic certificates providing HTTPS encryption across all subpaths. |
| **Version Control** | **Git & GitHub** | Source code management, repository tracking, and automated deployment pulls. |

---

## 4. Production Service Endpoints

- **Frontend Dashboard:** [https://djayamakmur.net/insignia](https://djayamakmur.net/insignia)
- **Backend API Base:** [https://djayamakmur.net/insignia/api/](https://djayamakmur.net/insignia/api/)
- **Swagger Documentation:** [https://djayamakmur.net/insignia/api/docs](https://djayamakmur.net/insignia/api/docs)
- **Default Admin Credentials:** `admin` / `admin123`
