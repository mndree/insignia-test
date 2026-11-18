# Crypto Wallet Backend API (Stoplight API Implementation)

NestJS REST API matching the assignment Stoplight reference, backed by PostgreSQL (`crypto-wallet`) and Prisma ORM.

---

## 🛠️ Stack & Architecture

- **Framework:** NestJS 12 (TypeScript, ESM)
- **Database:** PostgreSQL (Database: `crypto-wallet`)
- **ORM:** Prisma ORM 6
- **Auth:** Direct Header Token (`Authorization: <token>`, no mandatory Bearer prefix required)
- **Documentation:** Swagger OpenAPI available at `http://localhost:3000/docs`
- **Testing:** Supertest + Vitest (Contract E2E), TypeScript & PowerShell Smoke-Test Workflows

---

## 🔑 Admin Table & Authentication

An `admins` table has been created in PostgreSQL with encrypted passwords using bcrypt.

### Default Admin Credentials:
- **Username:** `admin`
- **Password:** `admin123`

### Admin Endpoints:
- `POST /admin/login` - Authenticate admin credentials and return an Admin Bearer token.
- `POST /admin/register` - Create a new admin account.

### How to use the Admin Token in Swagger UI:
1. Open [http://localhost:3000/docs](http://localhost:3000/docs)
2. Expand **Admin API** -> click `POST /admin/login` -> **Try it out**
3. Click **Execute** (with `admin` / `admin123`) and copy the `token` string from the response
4. Click the green **Authorize 🔓** button at the top right of the Swagger UI
5. Paste the token and click **Authorize**
6. All protected routes (`/topup`, `/balance`, `/transfer`, `/top_transactions_per_user`, `/top_users`) will now automatically send the Admin Bearer token with the lock icon active!

---

## 📌 API Endpoints

| # | Method | Endpoint | Auth | Description | Status Code |
|---|--------|----------|------|-------------|-------------|
| 1 | `POST` | `/user` | Public | Register user (`{"username":"alice"}`) -> returns `{"token":"..."}` | `201 Created` |
| 2 | `POST` | `/topup` | Required | Top up balance (`{"amount":100}`) | `204 No Content` |
| 3 | `GET` | `/balance` | Required | Read current balance -> `{"balance": 100}` | `200 OK` |
| 4 | `POST` | `/transfer` | Required | Transfer funds (`{"to_username":"bob","amount":25}`) | `204 No Content` |
| 5 | `GET` | `/top_transactions_per_user` | Required | Top 10 transfers sorted by abs amount (signed: - outgoing, + incoming) | `200 OK` |
| 6 | `GET` | `/top_users` | Required | Top 10 users ranked by outgoing transfer sum (excludes users without outgoing transfers) | `200 OK` |

---

## 🚀 Getting Started

### 1. Environment & Database Setup

Ensure PostgreSQL is running, then check `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:NewPassword123@localhost:5432/crypto-wallet?schema=public"
JWT_SECRET="insignia-assignment-secret-key-2026"
```

Sync database schema:
```bash
npm run prisma:push
```

### 2. Run the Development Server

**Option A: One-click Windows Batch file**
- Simply double-click [`run.bat`](file:///d:/1- Projects/insignia/run.bat)

**Option B: Terminal command**
```bash
npm run start:dev
```
- API Base URL: `http://localhost:3000`
- Interactive Swagger UI: `http://localhost:3000/docs`

---

## 🧪 Testing & Verification

### 1. Automated HTTP Contract Tests (22 Tests)
Tests all 6 routes with success scenarios, validation errors, duplicate handling, negative amounts, self-transfer prevention, and unauthorized rejections:
```bash
npm run test:e2e
```

### 2. Automated Smoke-Test Workflow (Node/TypeScript)
Registers Alice and Bob, captures tokens, tops up Alice (100), transfers to Bob (25), verifies post-transfer balances (Alice=75, Bob=25), verifies counterparty representations, and verifies overall top users ranking:
```bash
npm run test:smoke
```

### 3. Native Windows PowerShell Smoke-Test Script
```powershell
.\smoke-test.ps1
```

### 4. Postman Collection
Import [`postman_collection.json`](file:///d:/1-%20Projects/insignia/postman_collection.json) into Postman. It contains pre-configured test scripts that automatically capture and propagate `aliceToken` and `bobToken` across all requests.

---

## 💻 Windows PowerShell Instructions (No Bash Backslash Syntax)

Windows PowerShell does not support bash `\` line continuations. Use either `curl.exe` or `Invoke-RestMethod` below:

### Approach A: Using `Invoke-RestMethod` (Native PowerShell)

```powershell
# 1. Register Alice
$AliceRes = Invoke-RestMethod -Uri "http://localhost:3000/user" -Method Post -Body '{"username":"alice"}' -ContentType "application/json"
$AliceToken = $AliceRes.token

# 2. Register Bob
$BobRes = Invoke-RestMethod -Uri "http://localhost:3000/user" -Method Post -Body '{"username":"bob"}' -ContentType "application/json"
$BobToken = $BobRes.token

# 3. Balance Topup (Alice: 100)
Invoke-RestMethod -Uri "http://localhost:3000/topup" -Method Post -Headers @{ Authorization = $AliceToken } -Body '{"amount":100}' -ContentType "application/json"

# 4. Read Balance (Alice: Expected 100)
Invoke-RestMethod -Uri "http://localhost:3000/balance" -Method Get -Headers @{ Authorization = $AliceToken; Accept = "application/json" }

# 5. Transfer (Alice transfers 25 to Bob)
Invoke-RestMethod -Uri "http://localhost:3000/transfer" -Method Post -Headers @{ Authorization = $AliceToken } -Body '{"to_username":"bob","amount":25}' -ContentType "application/json"

# Check post-transfer balances
Invoke-RestMethod -Uri "http://localhost:3000/balance" -Method Get -Headers @{ Authorization = $AliceToken } # Returns 75
Invoke-RestMethod -Uri "http://localhost:3000/balance" -Method Get -Headers @{ Authorization = $BobToken }   # Returns 25

# 6. Top Transactions per User
Invoke-RestMethod -Uri "http://localhost:3000/top_transactions_per_user" -Method Get -Headers @{ Authorization = $AliceToken; Accept = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/top_transactions_per_user" -Method Get -Headers @{ Authorization = $BobToken; Accept = "application/json" }

# 7. List Overall Top Transacting Users
Invoke-RestMethod -Uri "http://localhost:3000/top_users" -Method Get -Headers @{ Authorization = $AliceToken; Accept = "application/json" }
```

---

### Approach B: Using Windows `curl.exe` (Single-Line Commands)

```powershell
# 1. Register Alice
curl.exe -X POST "http://localhost:3000/user" -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"username\":\"alice\"}"

# 2. Register Bob
curl.exe -X POST "http://localhost:3000/user" -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"username\":\"bob\"}"

# 3. Topup Alice (Replace <ALICE_TOKEN>)
curl.exe -X POST "http://localhost:3000/topup" -H "Authorization: <ALICE_TOKEN>" -H "Content-Type: application/json" -d "{\"amount\":100}"

# 4. Check Balance (Alice)
curl.exe -X GET "http://localhost:3000/balance" -H "Accept: application/json" -H "Authorization: <ALICE_TOKEN>"

# 5. Transfer to Bob
curl.exe -X POST "http://localhost:3000/transfer" -H "Authorization: <ALICE_TOKEN>" -H "Content-Type: application/json" -d "{\"to_username\":\"bob\",\"amount\":25}"

# 6. Top Transactions for Alice
curl.exe -X GET "http://localhost:3000/top_transactions_per_user" -H "Accept: application/json" -H "Authorization: <ALICE_TOKEN>"

# 7. Top Users
curl.exe -X GET "http://localhost:3000/top_users" -H "Accept: application/json" -H "Authorization: <ALICE_TOKEN>"
```
