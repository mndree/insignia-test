import { http, HttpResponse } from 'msw';
import {
  INITIAL_MOCK_USERS,
  INITIAL_MOCK_TRANSACTIONS,
  MockUser,
} from './data';
import {
  RegisterUserDto,
  TopupDto,
  TransferDto,
  LoginDto,
  TransactionRecordDto,
} from '@/types';

// Stateful in-memory stores for Demo mode simulation
let usersStore: MockUser[] = JSON.parse(JSON.stringify(INITIAL_MOCK_USERS));
let transactionsStore: (TransactionRecordDto & { owner: string })[] = JSON.parse(
  JSON.stringify(INITIAL_MOCK_TRANSACTIONS)
);

let txnIdCounter = 9022;

export function resetMockDatabase() {
  usersStore = JSON.parse(JSON.stringify(INITIAL_MOCK_USERS));
  transactionsStore = JSON.parse(JSON.stringify(INITIAL_MOCK_TRANSACTIONS));
  txnIdCounter = 9022;
}

/**
 * Helper to identify the authenticated user from the Authorization header.
 * Tolerates both "Authorization: <token>" and "Authorization: Bearer <token>"
 */
function getAuthenticatedUser(request: Request): MockUser | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const found = usersStore.find((u) => u.token === token);
  return found || null;
}

export const handlers = [
  // ----------------------------------------------------
  // 1. POST /user (Documented Stoplight API)
  // ----------------------------------------------------
  http.post('*/user', async ({ request }) => {
    try {
      const body = (await request.json()) as RegisterUserDto;
      if (!body.username || typeof body.username !== 'string' || !body.username.trim()) {
        return HttpResponse.json({ message: 'Username is required' }, { status: 400 });
      }

      const cleanUsername = body.username.trim().toLowerCase();
      const existing = usersStore.find((u) => u.username.toLowerCase() === cleanUsername);
      if (existing) {
        return HttpResponse.json(
          { message: `Username '${cleanUsername}' is already taken.` },
          { status: 409 }
        );
      }

      const newToken = `mock-token-${cleanUsername}-${Date.now()}`;
      const newUser: MockUser = {
        username: cleanUsername,
        token: newToken,
        balance: 0,
      };

      usersStore.push(newUser);
      return HttpResponse.json({ token: newToken }, { status: 201 });
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }
  }),

  // ----------------------------------------------------
  // 2. POST /auth/login & POST /admin/login (Proposed Extended API)
  // ----------------------------------------------------
  http.post(/\/auth\/login|\/admin\/login/, async ({ request }) => {
    try {
      const body = (await request.json()) as LoginDto;
      const { username, password } = body;

      if (!username || !password) {
        return HttpResponse.json(
          { message: 'Username and password are required' },
          { status: 400 }
        );
      }

      const user = usersStore.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      // In demo mode: accept 'admin' / 'admin123' or password123 for other mock users
      if (!user || (user.password && user.password !== password)) {
        return HttpResponse.json(
          { message: 'Invalid credentials. Demo credentials: username "admin", password "admin123".' },
          { status: 401 }
        );
      }

      return HttpResponse.json(
        {
          token: user.token,
          user: {
            username: user.username,
          },
        },
        { status: 200 }
      );
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON request' }, { status: 400 });
    }
  }),

  // ----------------------------------------------------
  // 3. GET /balance (Documented Stoplight API)
  // ----------------------------------------------------
  http.get('*/balance', ({ request }) => {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({ balance: user.balance }, { status: 200 });
  }),

  // ----------------------------------------------------
  // 4. POST /topup (Documented Stoplight API)
  // ----------------------------------------------------
  http.post('*/topup', async ({ request }) => {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = (await request.json()) as TopupDto;
      const amount = Number(body.amount);

      if (isNaN(amount) || amount <= 0) {
        return HttpResponse.json(
          { message: 'Top-up amount must be greater than 0.' },
          { status: 400 }
        );
      }

      if (amount >= 10000000) {
        return HttpResponse.json(
          { message: 'Top-up amount must be strictly less than 10,000,000.' },
          { status: 400 }
        );
      }

      // Update in-memory user balance
      user.balance += amount;

      // Add to transaction store for chart and history visibility
      const newTxn: TransactionRecordDto & { owner: string } = {
        id: `TXN-${txnIdCounter++}`,
        owner: user.username,
        username: 'system',
        amount: amount,
        created_at: new Date().toISOString(),
        description: 'Wallet balance top-up',
      };
      transactionsStore.unshift(newTxn);

      return new HttpResponse(null, { status: 204 });
    } catch {
      return HttpResponse.json({ message: 'Invalid top-up request' }, { status: 400 });
    }
  }),

  // ----------------------------------------------------
  // 5. POST /transfer (Documented Stoplight API)
  // ----------------------------------------------------
  http.post('*/transfer', async ({ request }) => {
    const sender = getAuthenticatedUser(request);
    if (!sender) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = (await request.json()) as TransferDto;
      const { to_username, amount: rawAmount } = body;
      const amount = Number(rawAmount);

      if (!to_username || !to_username.trim()) {
        return HttpResponse.json(
          { message: 'Recipient username is required.' },
          { status: 400 }
        );
      }

      const recipientUsername = to_username.trim().toLowerCase();

      if (sender.username.toLowerCase() === recipientUsername) {
        return HttpResponse.json(
          { message: 'Cannot transfer funds to yourself.' },
          { status: 400 }
        );
      }

      if (isNaN(amount) || amount <= 0) {
        return HttpResponse.json(
          { message: 'Transfer amount must be greater than 0.' },
          { status: 400 }
        );
      }

      if (sender.balance < amount) {
        return HttpResponse.json(
          { message: `Insufficient balance. Available: ${sender.balance} units, requested: ${amount} units.` },
          { status: 400 }
        );
      }

      const recipient = usersStore.find(
        (u) => u.username.toLowerCase() === recipientUsername
      );

      if (!recipient) {
        return HttpResponse.json(
          { message: `Recipient user '${to_username}' not found.` },
          { status: 404 }
        );
      }

      // Deduct from sender and credit recipient
      sender.balance -= amount;
      recipient.balance += amount;

      const now = new Date().toISOString();

      // Record outgoing for sender (negative amount)
      transactionsStore.unshift({
        id: `TXN-${txnIdCounter++}`,
        owner: sender.username,
        username: recipient.username,
        amount: -amount,
        created_at: now,
        description: `Transfer to @${recipient.username}`,
      });

      // Record incoming for recipient (positive amount)
      transactionsStore.unshift({
        id: `TXN-${txnIdCounter++}`,
        owner: recipient.username,
        username: sender.username,
        amount: amount,
        created_at: now,
        description: `Transfer from @${sender.username}`,
      });

      return new HttpResponse(null, { status: 204 });
    } catch {
      return HttpResponse.json({ message: 'Invalid transfer payload' }, { status: 400 });
    }
  }),

  // ----------------------------------------------------
  // 6. GET /top_transactions_per_user (Documented Stoplight API)
  // ----------------------------------------------------
  http.get('*/top_transactions_per_user', ({ request }) => {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userTransfers = transactionsStore.filter(
      (t) => t.owner === user.username
    );

    // Sort by absolute transaction amount descending, take top 10
    const top10 = [...userTransfers]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 10)
      .map((t) => ({
        username: t.username,
        amount: t.amount,
      }));

    return HttpResponse.json(top10, { status: 200 });
  }),

  // ----------------------------------------------------
  // 7. GET /top_users (Documented Stoplight API)
  // ----------------------------------------------------
  http.get('*/top_users', ({ request }) => {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Rank by total aggregated outgoing transfer value (positive number).
    // Incoming transfers do not count toward this ranking.
    const outgoingMap = new Map<string, number>();

    for (const txn of transactionsStore) {
      if (txn.amount < 0) {
        const current = outgoingMap.get(txn.owner) || 0;
        outgoingMap.set(txn.owner, current + Math.abs(txn.amount));
      }
    }

    // Convert map to array, sort descending, return up to 10
    const topUsers = Array.from(outgoingMap.entries())
      .map(([username, transacted_value]) => ({
        username,
        transacted_value,
      }))
      .filter((u) => u.transacted_value > 0)
      .sort((a, b) => b.transacted_value - a.transacted_value)
      .slice(0, 10);

    return HttpResponse.json(topUsers, { status: 200 });
  }),

  // ----------------------------------------------------
  // 8. GET /transactions (Proposed Extended API)
  // ----------------------------------------------------
  http.get('*/transactions', ({ request }) => {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10));
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const direction = url.searchParams.get('direction') || 'all';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';

    // Filter to authenticated user's transactions
    let filtered = transactionsStore.filter((t) => t.owner === user.username);

    // Apply search filter (by counterparty username or transaction ID)
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.username.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search)
      );
    }

    // Apply direction filter
    if (direction === 'incoming') {
      filtered = filtered.filter((t) => t.amount > 0);
    } else if (direction === 'outgoing') {
      filtered = filtered.filter((t) => t.amount < 0);
    }

    // Apply date range filter
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      if (!isNaN(fromTime)) {
        filtered = filtered.filter((t) => new Date(t.created_at).getTime() >= fromTime);
      }
    }
    if (dateTo) {
      const toTime = new Date(dateTo).getTime();
      if (!isNaN(toTime)) {
        filtered = filtered.filter((t) => new Date(t.created_at).getTime() <= toTime);
      }
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return HttpResponse.json(
      {
        items: paginatedItems,
        page,
        pageSize,
        total,
      },
      { status: 200 }
    );
  }),
];
