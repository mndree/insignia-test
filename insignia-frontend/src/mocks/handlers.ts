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
  UpdateUserProfileDto,
  AdminTransferRequestDto,
} from '@/types';

// Stateful in-memory stores for Demo mode simulation
let usersStore: MockUser[] = JSON.parse(JSON.stringify(INITIAL_MOCK_USERS));
let transactionsStore: (TransactionRecordDto & { owner: string; notes?: string })[] = JSON.parse(
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
  if (!authHeader) {
    // In demo mode default to admin if not provided
    return usersStore.find((u) => u.username === 'admin') || usersStore[0] || null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const found = usersStore.find((u) => u.token === token);
  return found || usersStore.find((u) => u.username === 'admin') || null;
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
        id: `user-${Date.now()}`,
        userCode: `USR-${String(usersStore.length + 1).padStart(4, '0')}`,
        username: cleanUsername,
        fullName: body.fullName || cleanUsername,
        email: body.email || `${cleanUsername}@example.com`,
        phone: body.phone || '+62 812 0000 0000',
        dateOfBirth: body.dateOfBirth || '01 Jan 1995',
        address: body.address || 'Indonesia',
        password: body.password || undefined,
        status: 'Active',
        token: newToken,
        balance: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      usersStore.push(newUser);
      return HttpResponse.json({ token: newToken }, { status: 201 });
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }
  }),

  // Check Username Availability
  http.get('*/check-username/:username', ({ params }) => {
    const { username } = params;
    const cleanUsername = String(username || '').trim().toLowerCase();
    const exists = usersStore.some((u) => u.username.toLowerCase() === cleanUsername);
    return HttpResponse.json({
      exists,
      available: !exists,
      message: exists
        ? `Username '${username}' is already taken.`
        : `Username '${username}' is available.`,
    });
  }),

  http.get('*/user/check-username/:username', ({ params }) => {
    const { username } = params;
    const cleanUsername = String(username || '').trim().toLowerCase();
    const exists = usersStore.some((u) => u.username.toLowerCase() === cleanUsername);
    return HttpResponse.json({
      exists,
      available: !exists,
      message: exists
        ? `Username '${username}' is already taken.`
        : `Username '${username}' is available.`,
    });
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

    const outgoingMap = new Map<string, number>();

    for (const txn of transactionsStore) {
      if (txn.amount < 0) {
        const current = outgoingMap.get(txn.owner) || 0;
        outgoingMap.set(txn.owner, current + Math.abs(txn.amount));
      }
    }

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

    let filtered = transactionsStore.filter((t) => t.owner === user.username);

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.username.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search)
      );
    }

    if (direction === 'incoming') {
      filtered = filtered.filter((t) => t.amount > 0);
    } else if (direction === 'outgoing') {
      filtered = filtered.filter((t) => t.amount < 0);
    }

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

    const sortBy = url.searchParams.get('sortBy') || '';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    if (sortBy) {
      const isAsc = sortOrder === 'asc';
      filtered.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'id') {
          cmp = a.id.localeCompare(b.id);
        } else if (sortBy === 'username' || sortBy === 'counterparty') {
          cmp = a.username.localeCompare(b.username);
        } else if (sortBy === 'direction') {
          const dirA = a.amount > 0 ? 'incoming' : 'outgoing';
          const dirB = b.amount > 0 ? 'incoming' : 'outgoing';
          cmp = dirA.localeCompare(dirB);
        } else if (sortBy === 'amount') {
          cmp = a.amount - b.amount;
        } else if (sortBy === 'created_at' || sortBy === 'date') {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return isAsc ? cmp : -cmp;
      });
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

  // ----------------------------------------------------
  // 9. GET /admin/users (Users List with Stats)
  // ----------------------------------------------------
  http.get('*/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10));
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = url.searchParams.get('status') || '';

    let filtered = [...usersStore];

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.userCode.toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All statuses') {
      filtered = filtered.filter((u) => u.status.toLowerCase() === status.toLowerCase());
    }

    const sortBy = url.searchParams.get('sortBy') || '';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';
    if (sortBy) {
      const isAsc = sortOrder === 'asc';
      filtered.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'user') {
          cmp = (a.fullName || a.username).localeCompare(b.fullName || b.username);
        } else if (sortBy === 'email') {
          cmp = (a.email || '').localeCompare(b.email || '');
        } else if (sortBy === 'balance') {
          cmp = a.balance - b.balance;
        } else if (sortBy === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else if (sortBy === 'joinedDate') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return isAsc ? cmp : -cmp;
      });
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    const totalUsers = usersStore.length;
    const activeUsers = usersStore.filter((u) => u.status === 'Active').length;
    const totalWalletBalance = usersStore.reduce((sum, u) => sum + u.balance, 0);

    return HttpResponse.json(
      {
        items: paginatedItems,
        page,
        pageSize,
        total,
        stats: {
          totalUsers,
          activeUsers,
          totalWalletBalance,
        },
      },
      { status: 200 }
    );
  }),

  // ----------------------------------------------------
  // 10. GET /admin/users/:idOrUsername (User Details)
  // ----------------------------------------------------
  http.get('*/admin/users/:idOrUsername', ({ params }) => {
    const param = String(params.idOrUsername).toLowerCase();
    const user = usersStore.find(
      (u) =>
        u.id.toLowerCase() === param ||
        u.username.toLowerCase() === param ||
        u.userCode.toLowerCase() === param
    );

    if (!user) {
      return HttpResponse.json({ message: `User '${params.idOrUsername}' not found` }, { status: 404 });
    }

    // Get user's transactions
    const userTxns = transactionsStore.filter((t) => t.owner === user.username);
    let totalReceived = 0;
    let totalSent = 0;

    userTxns.forEach((t) => {
      if (t.amount > 0) totalReceived += t.amount;
      else totalSent += Math.abs(t.amount);
    });

    // Provide default mockup figures if andre
    if (user.username === 'andre') {
      totalReceived = 40000;
      totalSent = 15500;
    }

    const recentTransactions = userTxns.slice(0, 10).map((t) => ({
      id: t.id,
      counterparty: t.username,
      counterpartyName: usersStore.find((u) => u.username === t.username)?.fullName || t.username,
      direction: t.amount > 0 ? ('incoming' as const) : ('outgoing' as const),
      amount: t.amount,
      createdAt: t.created_at,
      notes: t.notes || t.description,
    }));

    return HttpResponse.json(
      {
        id: user.id,
        userCode: user.userCode,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        status: user.status,
        balance: user.balance,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        stats: {
          availableBalance: user.balance,
          totalReceived,
          totalSent,
        },
        recentTransactions,
      },
      { status: 200 }
    );
  }),

  // ----------------------------------------------------
  // 11. PATCH /admin/users/:idOrUsername (Update User Profile)
  // ----------------------------------------------------
  http.patch('*/admin/users/:idOrUsername', async ({ params, request }) => {
    const param = String(params.idOrUsername).toLowerCase();
    const user = usersStore.find(
      (u) =>
        u.id.toLowerCase() === param ||
        u.username.toLowerCase() === param ||
        u.userCode.toLowerCase() === param
    );

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    try {
      const body = (await request.json()) as UpdateUserProfileDto;
      if (body.fullName !== undefined) user.fullName = body.fullName;
      if (body.email !== undefined) user.email = body.email;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;
      if (body.address !== undefined) user.address = body.address;
      if (body.status !== undefined) user.status = body.status;

      return HttpResponse.json(user, { status: 200 });
    } catch {
      return HttpResponse.json({ message: 'Invalid update body' }, { status: 400 });
    }
  }),

  // ----------------------------------------------------
  // 12. POST /admin/users/:idOrUsername/transfer (Admin Transfer)
  // ----------------------------------------------------
  http.post('*/admin/users/:idOrUsername/transfer', async ({ params, request }) => {
    const param = String(params.idOrUsername).toLowerCase();
    const sender = usersStore.find(
      (u) =>
        u.id.toLowerCase() === param ||
        u.username.toLowerCase() === param ||
        u.userCode.toLowerCase() === param
    );

    if (!sender) {
      return HttpResponse.json({ message: 'Sender not found' }, { status: 404 });
    }

    try {
      const body = (await request.json()) as AdminTransferRequestDto;
      const { to_username, amount: rawAmount, notes } = body;
      const amount = Number(rawAmount);

      if (!to_username) {
        return HttpResponse.json({ message: 'Recipient is required' }, { status: 400 });
      }

      const recipient = usersStore.find(
        (u) => u.username.toLowerCase() === to_username.toLowerCase()
      );

      if (!recipient) {
        return HttpResponse.json({ message: `Recipient '${to_username}' not found` }, { status: 404 });
      }

      if (sender.username.toLowerCase() === recipient.username.toLowerCase()) {
        return HttpResponse.json({ message: 'Cannot transfer to same user' }, { status: 400 });
      }

      if (isNaN(amount) || amount <= 0) {
        return HttpResponse.json({ message: 'Amount must be greater than 0' }, { status: 400 });
      }

      if (sender.balance < amount) {
        return HttpResponse.json(
          { message: `Insufficient balance. Available: ${sender.balance} units` },
          { status: 400 }
        );
      }

      sender.balance -= amount;
      recipient.balance += amount;

      const code = `TXN-${txnIdCounter++}`;
      const now = new Date().toISOString();

      transactionsStore.unshift({
        id: code,
        owner: sender.username,
        username: recipient.username,
        amount: -amount,
        created_at: now,
        description: notes || `Transfer to @${recipient.username}`,
        notes,
      });

      transactionsStore.unshift({
        id: `TXN-${txnIdCounter++}`,
        owner: recipient.username,
        username: sender.username,
        amount: amount,
        created_at: now,
        description: notes || `Transfer from @${sender.username}`,
        notes,
      });

      return HttpResponse.json(
        {
          success: true,
          transferCode: code,
          amount,
          senderBalanceAfter: sender.balance,
        },
        { status: 200 }
      );
    } catch {
      return HttpResponse.json({ message: 'Invalid transfer payload' }, { status: 400 });
    }
  }),

  // Change Admin Password
  http.patch('*/admin/change-password', async ({ request }) => {
    try {
      const body = (await request.json()) as any;
      return HttpResponse.json({
        success: true,
        message: 'Password successfully updated for ' + (body.username || 'admin'),
      });
    } catch {
      return HttpResponse.json({ message: 'Failed to update password' }, { status: 400 });
    }
  }),

  // Get Admin Profile
  http.get('*/admin/profile/:username', ({ params }) => {
    const { username } = params;
    const user = usersStore.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
    return HttpResponse.json({
      id: user?.id || 'admin-001',
      username: username || 'admin',
      fullName: user?.fullName || 'System Administrator',
      email: user?.email || 'admin@insignia.wallet',
      phone: user?.phone || '+62 812 3456 7890',
      dateOfBirth: user?.dateOfBirth || '15 May 1996',
      address: user?.address || 'Jakarta, Indonesia',
      avatarUrl: (user as any)?.avatarUrl || null,
      status: 'Active',
      balance: user?.balance || 24500,
    });
  }),

  // Update Admin Profile
  http.patch('*/admin/profile/:username', async ({ params, request }) => {
    const { username } = params;
    try {
      const body = (await request.json()) as any;
      const user = usersStore.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
      if (user) {
        if (body.fullName !== undefined) user.fullName = body.fullName;
        if (body.email !== undefined) user.email = body.email;
        if (body.phone !== undefined) user.phone = body.phone;
        if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;
        if (body.address !== undefined) user.address = body.address;
        if (body.avatarUrl !== undefined) (user as any).avatarUrl = body.avatarUrl || null;
      }
      return HttpResponse.json({
        success: true,
        message: 'Profile updated successfully',
        ...body,
      });
    } catch {
      return HttpResponse.json({ message: 'Failed to update profile' }, { status: 400 });
    }
  }),
];
