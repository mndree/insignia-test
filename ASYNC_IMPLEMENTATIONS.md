# Asynchronous Implementations in Insignia Wallet

This document catalogs the asynchronous programming patterns, primitives, and implementations across the **Insignia Wallet** project (`insignia-backend` and `insignia-frontend`).

---

## 1. Architecture Overview

| Layer | Runtime / Engine | Key Asynchronous Primitives | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | Node.js (V8 Event Loop) | `async/await`, `Promise.all`, `prisma.$transaction`, `bcrypt` | Non-blocking database I/O, multi-record concurrency, cryptography, ACID guarantees |
| **Frontend** | React 18 + Vite (Browser) | TanStack Query (`useQuery`, `useMutation`), `axios`, `setTimeout`, SweetAlert2 | Non-blocking HTTP calls, cache invalidation, UI debouncing, promise-based modal alerts |

---

## 2. Backend Implementations (`insignia-backend`)

### 2.1 Prisma Interactive Database Transactions (`prisma.$transaction`)
Ensures ACID compliance (Atomicity, Consistency, Isolation, Durability) for multi-step balance deductions, ledger entries, and counterparty balance updates.

- **File**: [`insignia-backend/src/services/wallet.service.ts`](file:///d:/1-%20Projects/insignia-test/insignia-backend/src/services/wallet.service.ts#L181-L235)
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Fetch current sender state inside transaction lock
  const currentSender = await tx.user.findUnique({
    where: { id: sender.id },
  });

  if (!currentSender || currentSender.balance.lessThan(decimalAmount)) {
    throw new BadRequestException('Insufficient balance');
  }

  // 2. Decrement sender balance
  await tx.user.update({
    where: { id: sender.id },
    data: { balance: { decrement: decimalAmount } },
  });

  // 3. Increment recipient balance
  await tx.user.update({
    where: { id: recipient.id },
    data: { balance: { increment: decimalAmount } },
  });

  // 4. Record transfer transaction ledger entry
  await tx.transfer.create({
    data: {
      fromUserId: sender.id,
      toUserId: recipient.id,
      amount: decimalAmount,
    },
  });
});
```

---

### 2.2 Parallel Query Execution with `Promise.all`
Executes independent database reads concurrently across separate database connections rather than sequentially, reducing API latency from $O(\sum t_i)$ to $O(\max t_i)$.

- **File**: [`insignia-backend/src/services/admin.service.ts`](file:///d:/1-%20Projects/insignia-test/insignia-backend/src/services/admin.service.ts#L258-L275)
```typescript
const [items, total, totalUsers, activeUsers, balanceAggregate] = await Promise.all([
  prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    orderBy,
  }),
  prisma.user.count({ where }),
  prisma.user.count({ where: baseWhere }),
  prisma.user.count({ where: { ...baseWhere, status: 'Active' } }),
  prisma.user.aggregate({
    where: baseWhere,
    _sum: { balance: true },
  }),
]);
```

---

### 2.3 Asynchronous Express Route Controllers & Middleware
Asynchronous route handlers that catch unhandled rejections and forward them cleanly to Express error middleware via `next(err)`.

- **File**: [`insignia-backend/src/routes/wallet.routes.ts`](file:///d:/1-%20Projects/insignia-test/insignia-backend/src/routes/wallet.routes.ts#L84-L92)
```typescript
walletRouter.get('/balance', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getBalance(req.user.id, req.isAdmin);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
```

---

### 2.4 Asynchronous Cryptography & Password Hashing
Uses CPU worker pool via libuv threadpool (`bcrypt.hash` and `bcrypt.compare`) so the main Node.js event loop is never blocked by expensive key-derivation calculations.

- **File**: [`insignia-backend/src/services/auth.service.ts`](file:///d:/1-%20Projects/insignia-test/insignia-backend/src/services/auth.service.ts#L25-L65)
```typescript
// Hash password asynchronously
const hashedPassword = await bcrypt.hash(dto.password, 10);

// Verify password asynchronously during sign-in
const isMatch = await bcrypt.compare(dto.password, user.password);
if (!isMatch) {
  throw new UnauthorizedException('Invalid credentials');
}
```

---

### 2.5 Asynchronous Authentication & Request Hydration Middleware
Asynchronously inspects JWT bearer tokens, queries the database for user/admin accounts, and binds authenticated entities onto Express request objects before downstream route execution.

- **File**: [`insignia-backend/src/auth/auth.middleware.ts`](file:///d:/1-%20Projects/insignia-test/insignia-backend/src/auth/auth.middleware.ts#L38-L85)
```typescript
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = verifyJwt(token);

    if (payload.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      req.admin = admin;
      req.isAdmin = true;
      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    req.isAdmin = false;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

---

## 3. Frontend Implementations (`insignia-frontend`)

### 3.1 TanStack Query: Asynchronous Data Fetching & Cache Synchronization (`useQuery`)
Non-blocking declarative queries with automatic background revalidation, stale-time management, and conditional trigger flags (`enabled`).

- **File**: [`insignia-frontend/src/features/overview/OverviewPage.tsx`](file:///d:/1-%20Projects/insignia-test/insignia-frontend/src/features/overview/OverviewPage.tsx#L23-L47)
```typescript
// 1. Asynchronously fetch live wallet balance
const {
  data: balanceData,
  isLoading: isBalanceLoading,
  isFetching: isBalanceFetching,
  refetch: refetchBalance,
} = useQuery({
  queryKey: ['balance', { role: user?.role }],
  queryFn: getBalanceApi,
});

// 2. Conditionally fetch admin user aggregate statistics
const {
  data: usersListData,
  isLoading: isUsersLoading,
  refetch: refetchUsers,
} = useQuery({
  queryKey: ['admin_users_stats'],
  queryFn: () => getUsersListApi({ page: 1, pageSize: 1 }),
  enabled: isAdmin,
});
```

---

### 3.2 TanStack Query: Asynchronous Form Submissions & Cache Invalidation (`useMutation`)
Executes asynchronous server mutations and immediately triggers background query invalidation to update balances and transaction tables in real time without a full page reload.

- **File**: [`insignia-frontend/src/features/overview/TransferModal.tsx`](file:///d:/1-%20Projects/insignia-test/insignia-frontend/src/features/overview/TransferModal.tsx#L100-L145)
```typescript
const mutation = useMutation({
  mutationFn: async (data: { fromUserId?: string; to_username: string; amount: number; notes?: string }) => {
    if (isAdmin && data.fromUserId) {
      return adminTransferBalanceApi(data.fromUserId, data);
    }
    return transferApi({ to_username: data.to_username, amount: data.amount });
  },
  onSuccess: (data) => {
    showSuccessAlert('Transfer Successful!', 'Funds have been delivered.');
    // Asynchronously invalidate all affected queries across the app
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['wallet_balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['admin_users'] });
  },
  onError: (err) => {
    showErrorAlert('Transfer Failed', normalizeApiError(err).message);
  },
});
```

---

### 3.3 Axios Interceptors & Network Promise Pipeline
Centralized promise-based HTTP client pipeline injecting dynamic auth tokens and standardizing error handling asynchronously.

- **File**: [`insignia-frontend/src/services/api/client.ts`](file:///d:/1-%20Projects/insignia-test/insignia-frontend/src/services/api/client.ts#L31-L45)
```typescript
// Request Interceptor: Injects dynamic JWT token into request headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAuthToken && !config.headers.Authorization) {
      config.headers.Authorization = currentAuthToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

---

### 3.4 Promise-based Modal Alerts & Confirmation Dialogs (SweetAlert2)
Converts UI alerts and confirmations into awaitable Promises with automatic timer cleanups.

- **File**: [`insignia-frontend/src/utils/sweetalert.ts`](file:///d:/1-%20Projects/insignia-test/insignia-frontend/src/utils/sweetalert.ts#L13-L30)
```typescript
export const showSuccessAlert = async (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  if (isTestEnv) {
    return { isConfirmed: true, isDenied: false, isDismissed: false, value: true } as any;
  }
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#4f46e5',
    timer: 2500,
    timerProgressBar: true,
    ...options,
  });
};
```

---

### 3.5 Event Loop & Timer-based Asynchrony: Search Debounce Hook (`useDebounce`)
Uses the JavaScript Macrotask queue (`setTimeout` / `clearTimeout`) to throttle rapid input changes (e.g. typing in search bars) before triggering backend requests.

- **File**: [`insignia-frontend/src/hooks/useDebounce.ts`](file:///d:/1-%20Projects/insignia-test/insignia-frontend/src/hooks/useDebounce.ts#L1-L17)
```typescript
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 4. Summary Matrix

| # | Implementation | File | Asynchronous Technique | Key Benefit |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Fund Transfer & Topup | `wallet.service.ts` | `prisma.$transaction(async (tx) => ...)` | Atomic rollback on error; zero data inconsistency |
| **2** | User Directory & Stats | `admin.service.ts` | `Promise.all([...])` | Queries tables, counts, and sums concurrently |
| **3** | Endpoint Handlers | `wallet.routes.ts` | `async (req, res, next) => ...` | Keeps Node.js event loop free to handle other traffic |
| **4** | Password Verification | `auth.service.ts` | `await bcrypt.compare(...)` | Offloads CPU-intensive PBKDF2 hashing to libuv threads |
| **5** | Auth Token Hydration | `auth.middleware.ts`| `await prisma.user.findUnique(...)` | Asynchronously resolves identity before route execution |
| **6** | Financial Queries | `OverviewPage.tsx` | `useQuery({ queryFn: async () => ... })` | Client-side caching, background revalidation |
| **7** | Form Actions | `TransferModal.tsx` | `useMutation({ mutationFn: ... })` | Non-blocking submissions with automated cache invalidation |
| **8** | API Gateway Client | `client.ts` | `axios.interceptors.request.use(...)` | Promise pipeline for token injection & network retry |
| **9** | Notification Alerts | `sweetalert.ts` | `await Swal.fire(...)` | Asynchronous dialog UX without blocking rendering |
| **10**| Search Throttling | `useDebounce.ts` | `setTimeout` / `clearTimeout` | Asynchronous rate-limiting to prevent server flooding |
