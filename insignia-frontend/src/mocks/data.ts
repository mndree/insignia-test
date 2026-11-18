import { TransactionRecordDto } from '@/types';

export interface MockUser {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  status: 'Active' | 'Inactive';
  password?: string;
  token: string;
  balance: number;
  createdAt: string;
  lastLoginAt: string;
}

export const INITIAL_KEY_USERS: MockUser[] = [
  {
    id: 'user-0001',
    userCode: 'USR-0001',
    username: 'andre',
    fullName: 'Andre Juliansyah',
    email: 'andre.juliansyah@example.com',
    phone: '+62 812 3456 7890',
    dateOfBirth: '15 May 1996',
    address: 'South Jakarta, Indonesia',
    status: 'Active',
    password: 'password123',
    token: 'mock-token-andre-111',
    balance: 24500,
    createdAt: '2026-11-18T09:40:00Z',
    lastLoginAt: '2026-11-18T16:35:00Z',
  },
  {
    id: 'user-0002',
    userCode: 'USR-0002',
    username: 'azra',
    fullName: 'Azra Putri',
    email: 'azra.putri@example.com',
    phone: '+62 813 9876 5432',
    dateOfBirth: '22 Aug 1998',
    address: 'Bandung, Indonesia',
    status: 'Active',
    password: 'password123',
    token: 'mock-token-azra-222',
    balance: 18250,
    createdAt: '2026-11-17T14:15:00Z',
    lastLoginAt: '2026-11-18T11:20:00Z',
  },
  {
    id: 'user-0003',
    userCode: 'USR-0003',
    username: 'raka',
    fullName: 'Raka Feisal',
    email: 'raka.feisal@example.com',
    phone: '+62 811 2345 6789',
    dateOfBirth: '10 Feb 1995',
    address: 'Surabaya, Indonesia',
    status: 'Active',
    password: 'password123',
    token: 'mock-token-raka-333',
    balance: 32000,
    createdAt: '2026-11-16T11:20:00Z',
    lastLoginAt: '2026-11-18T10:00:00Z',
  },
  {
    id: 'user-0004',
    userCode: 'USR-0004',
    username: 'alice',
    fullName: 'Alice Morgan',
    email: 'alice.morgan@example.com',
    phone: '+1 415 555 0192',
    dateOfBirth: '03 Dec 1994',
    address: 'San Francisco, CA, USA',
    status: 'Inactive',
    password: 'password123',
    token: 'mock-token-alice-444',
    balance: 12800,
    createdAt: '2026-11-15T16:05:00Z',
    lastLoginAt: '2026-11-15T16:10:00Z',
  },
  {
    id: 'user-0005',
    userCode: 'USR-0005',
    username: 'bob',
    fullName: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phone: '+44 20 7946 0912',
    dateOfBirth: '17 Jul 1993',
    address: 'London, UK',
    status: 'Active',
    password: 'password123',
    token: 'mock-token-bob-555',
    balance: 8450,
    createdAt: '2026-11-14T13:30:00Z',
    lastLoginAt: '2026-11-18T08:45:00Z',
  },
  {
    id: 'user-0006',
    userCode: 'USR-0006',
    username: 'charlie',
    fullName: 'Charlie Lee',
    email: 'charlie.lee@example.com',
    phone: '+65 9123 4567',
    dateOfBirth: '29 Oct 1991',
    address: 'Singapore',
    status: 'Active',
    password: 'password123',
    token: 'mock-token-charlie-666',
    balance: 21600,
    createdAt: '2026-11-13T10:10:00Z',
    lastLoginAt: '2026-11-17T19:30:00Z',
  },
  {
    id: 'user-admin',
    userCode: 'USR-0000',
    username: 'admin',
    fullName: 'Administrator',
    email: 'admin@insignia.wallet',
    phone: '+62 800 1234 5678',
    dateOfBirth: '01 Jan 1990',
    address: 'Jakarta, Indonesia',
    status: 'Active',
    password: 'admin123',
    token: 'mock-token-admin-987654321',
    balance: 14250,
    createdAt: '2026-10-01T08:00:00Z',
    lastLoginAt: '2026-11-18T16:00:00Z',
  },
];

// Generate 128 total users matching exactly 116 active and 845,250 total balance
function generateAllMockUsers(): MockUser[] {
  const users: MockUser[] = [...INITIAL_KEY_USERS];

  const firstNames = ['David', 'Elena', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Marcus', 'Nadia', 'Oscar', 'Priya', 'Quentin', 'Rachel', 'Sam', 'Tara', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];

  const currentSum = users.reduce((sum, u) => sum + u.balance, 0);
  const targetSum = 845250;
  const remainingSum = targetSum - currentSum;
  const targetTotal = 128;
  const countToCreate = targetTotal - users.length;
  const avg = Math.floor(remainingSum / countToCreate);

  let acc = 0;
  for (let i = users.length + 1; i <= targetTotal; i++) {
    const num = String(i).padStart(4, '0');
    const fName = firstNames[(i * 3) % firstNames.length];
    const lName = lastNames[(i * 7) % lastNames.length];
    const username = `${fName.toLowerCase()}_${lName.toLowerCase()}${i}`;
    const isInactive = i >= 118; // 11 inactive + Alice = 12 inactive total -> 116 active!

    const bal = (i === targetTotal)
      ? (remainingSum - acc)
      : Math.max(500, Math.round((avg + ((i % 10) - 5) * 450) / 50) * 50);

    acc += bal;

    const daysAgo = Math.min(60, Math.floor(i / 2));
    const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    users.push({
      id: `user-${num}`,
      userCode: `USR-${num}`,
      username,
      fullName: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
      phone: `+1 555 ${1000 + i}`,
      dateOfBirth: '12 Jan 1995',
      address: 'New York, USA',
      status: isInactive ? 'Inactive' : 'Active',
      password: 'password123',
      token: `mock-token-${username}`,
      balance: bal,
      createdAt: createdDate,
      lastLoginAt: new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return users;
}

export const INITIAL_MOCK_USERS: MockUser[] = generateAllMockUsers();

// Seed realistic transaction records for 'andre' & 'admin'
export const INITIAL_MOCK_TRANSACTIONS: (TransactionRecordDto & { owner: string; notes?: string })[] = [
  // Andre Juliansyah's transactions (matching User Details mockup)
  {
    id: 'TXN-9021',
    owner: 'andre',
    username: 'azra',
    amount: -2500,
    created_at: '2026-11-18T10:45:00Z',
    description: 'Contractor settlement payout',
    notes: 'Project settlement payout',
  },
  {
    id: 'TXN-9020',
    owner: 'andre',
    username: 'raka',
    amount: 1800,
    created_at: '2026-11-17T14:20:00Z',
    description: 'Reimbursement for infrastructure',
    notes: 'Infrastructure reimbursement',
  },
  {
    id: 'TXN-9019',
    owner: 'andre',
    username: 'alice',
    amount: -1200,
    created_at: '2026-11-16T11:05:00Z',
    description: 'Design asset license fee',
    notes: 'Design asset fee',
  },
  {
    id: 'TXN-9015',
    owner: 'andre',
    username: 'bob',
    amount: 38200,
    created_at: '2026-11-10T08:00:00Z',
    description: 'Treasury reserve fund transfer',
    notes: 'Treasury reserve fund transfer',
  },
  {
    id: 'TXN-9014',
    owner: 'andre',
    username: 'charlie',
    amount: -11800,
    created_at: '2026-11-08T15:30:00Z',
    description: 'Quarterly node validator allocation',
    notes: 'Quarterly node validator allocation',
  },

  // Admin user transactions
  {
    id: 'TXN-9018',
    owner: 'admin',
    username: 'system',
    amount: 5000,
    created_at: '2026-11-15T08:00:00Z',
    description: 'Direct wallet balance top-up',
  },
  {
    id: 'TXN-9017',
    owner: 'admin',
    username: 'bob',
    amount: -750,
    created_at: '2026-11-14T16:30:00Z',
    description: 'External security audit retainer',
  },
  {
    id: 'TXN-9016',
    owner: 'admin',
    username: 'charlie',
    amount: 3200,
    created_at: '2026-11-13T14:15:00Z',
    description: 'Treasury reserve allocation',
  },
  {
    id: 'TXN-9013',
    owner: 'admin',
    username: 'azra',
    amount: 1500,
    created_at: '2026-11-08T12:20:00Z',
    description: 'Escrow release credit',
  },
  {
    id: 'TXN-9012',
    owner: 'admin',
    username: 'raka',
    amount: -800,
    created_at: '2026-11-06T09:10:00Z',
    description: 'API integration fee',
  },
  {
    id: 'TXN-9011',
    owner: 'admin',
    username: 'system',
    amount: 10000,
    created_at: '2026-11-04T07:30:00Z',
    description: 'Initial seed capital top-up',
  },
];
