import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database for Insignia Wallet...');

  // 1. Clear existing records cleanly
  await prisma.transfer.deleteMany();
  await prisma.topup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  // 2. Seed Admin account
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  // 3. Specific mock users from UI mockup
  const keyUsers = [
    {
      userCode: 'USR-0001',
      username: 'andre',
      fullName: 'Andre Juliansyah',
      email: 'andre.juliansyah@example.com',
      phone: '+62 812 3456 7890',
      dateOfBirth: '15 May 1996',
      address: 'South Jakarta, Indonesia',
      status: 'Active',
      balance: 24500,
      createdAt: new Date('2026-11-18T09:40:00Z'),
      lastLoginAt: new Date('2026-11-18T16:35:00Z'),
    },
    {
      userCode: 'USR-0002',
      username: 'azra',
      fullName: 'Azra Putri',
      email: 'azra.putri@example.com',
      phone: '+62 813 9876 5432',
      dateOfBirth: '22 Aug 1998',
      address: 'Bandung, Indonesia',
      status: 'Active',
      balance: 18250,
      createdAt: new Date('2026-11-17T14:15:00Z'),
      lastLoginAt: new Date('2026-11-18T11:20:00Z'),
    },
    {
      userCode: 'USR-0003',
      username: 'raka',
      fullName: 'Raka Feisal',
      email: 'raka.feisal@example.com',
      phone: '+62 811 2345 6789',
      dateOfBirth: '10 Feb 1995',
      address: 'Surabaya, Indonesia',
      status: 'Active',
      balance: 32000,
      createdAt: new Date('2026-11-16T11:20:00Z'),
      lastLoginAt: new Date('2026-11-18T10:00:00Z'),
    },
    {
      userCode: 'USR-0004',
      username: 'alice',
      fullName: 'Alice Morgan',
      email: 'alice.morgan@example.com',
      phone: '+1 415 555 0192',
      dateOfBirth: '03 Dec 1994',
      address: 'San Francisco, CA, USA',
      status: 'Inactive',
      balance: 12800,
      createdAt: new Date('2026-11-15T16:05:00Z'),
      lastLoginAt: new Date('2026-11-15T16:10:00Z'),
    },
    {
      userCode: 'USR-0005',
      username: 'bob',
      fullName: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+44 20 7946 0912',
      dateOfBirth: '17 Jul 1993',
      address: 'London, UK',
      status: 'Active',
      balance: 8450,
      createdAt: new Date('2026-11-14T13:30:00Z'),
      lastLoginAt: new Date('2026-11-18T08:45:00Z'),
    },
    {
      userCode: 'USR-0006',
      username: 'charlie',
      fullName: 'Charlie Lee',
      email: 'charlie.lee@example.com',
      phone: '+65 9123 4567',
      dateOfBirth: '29 Oct 1991',
      address: 'Singapore',
      status: 'Active',
      balance: 21600,
      createdAt: new Date('2026-11-13T10:10:00Z'),
      lastLoginAt: new Date('2026-11-17T19:30:00Z'),
    },
  ];

  const createdUserMap = new Map<string, string>();

  for (const u of keyUsers) {
    const record = await prisma.user.create({
      data: u,
    });
    createdUserMap.set(u.username, record.id);
  }

  // Create additional users up to 128 total
  // Target: Total = 128, Active = 116 (so 12 Inactive total: Alice is 1, so 11 more)
  // Target sum: 845,250 units
  const initialSum = keyUsers.reduce((sum, u) => sum + u.balance, 0); // 117,600
  const remainingSum = 845250 - initialSum; // 727,650
  const remainingCount = 128 - keyUsers.length; // 122 users
  const avgBalance = Math.floor(remainingSum / remainingCount); // ~5,964

  const firstNames = ['David', 'Elena', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Marcus', 'Nadia', 'Oscar', 'Priya', 'Quentin', 'Rachel', 'Sam', 'Tara', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];

  let accumulatedBalance = 0;

  for (let i = 7; i <= 128; i++) {
    const userNum = String(i).padStart(4, '0');
    const fName = firstNames[(i * 3) % firstNames.length];
    const lName = lastNames[(i * 7) % lastNames.length];
    const username = `${fName.toLowerCase()}_${lName.toLowerCase()}${i}`;
    const isInactive = i >= 118; // 11 users inactive (from 118 to 128 = 11 + Alice = 12 inactive total -> 116 active!)
    
    let bal = (i === 128)
      ? (remainingSum - accumulatedBalance)
      : Math.max(500, Math.round((avgBalance + ((i % 10) - 5) * 500) / 50) * 50);

    accumulatedBalance += bal;

    const daysAgo = Math.min(60, Math.floor(i / 2));
    const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const rec = await prisma.user.create({
      data: {
        userCode: `USR-${userNum}`,
        username,
        fullName: `${fName} ${lName}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
        phone: `+1 555 ${String(1000 + i)}`,
        dateOfBirth: '12 Jan 1995',
        address: 'New York, USA',
        status: isInactive ? 'Inactive' : 'Active',
        balance: bal,
        createdAt: createdDate,
        lastLoginAt: new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000),
      },
    });
    createdUserMap.set(username, rec.id);
  }

  // 4. Seed key transfers for Andre Juliansyah (matching the User Details mockup)
  // Recent transactions for Andre:
  // TXN-9021: Outgoing to @azra (-2,500 units), 18 Nov 2026
  // TXN-9020: Incoming from @raka (+1,800 units), 17 Nov 2026
  // TXN-9019: Outgoing to @alice (-1,200 units), 16 Nov 2026
  const andreId = createdUserMap.get('andre')!;
  const azraId = createdUserMap.get('azra')!;
  const rakaId = createdUserMap.get('raka')!;
  const aliceId = createdUserMap.get('alice')!;

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9021',
      fromUserId: andreId,
      toUserId: azraId,
      amount: 2500,
      notes: 'Project settlement payout',
      createdAt: new Date('2026-11-18T10:45:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9020',
      fromUserId: rakaId,
      toUserId: andreId,
      amount: 1800,
      notes: 'Infrastructure reimbursement',
      createdAt: new Date('2026-11-17T14:20:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9019',
      fromUserId: andreId,
      toUserId: aliceId,
      amount: 1200,
      notes: 'Design asset fee',
      createdAt: new Date('2026-11-16T11:05:00Z'),
    },
  });

  // Additional historical transfers to reach Andre's mockup totals:
  // Total Received = 40,000 units (1,800 + 38,200)
  // Total Sent = 15,500 units (2,500 + 1,200 + 11,800)
  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9015',
      fromUserId: createdUserMap.get('bob')!,
      toUserId: andreId,
      amount: 38200,
      notes: 'Treasury reserve fund transfer',
      createdAt: new Date('2026-11-10T08:00:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9014',
      fromUserId: andreId,
      toUserId: createdUserMap.get('charlie')!,
      amount: 11800,
      notes: 'Quarterly node validator allocation',
      createdAt: new Date('2026-11-08T15:30:00Z'),
    },
  });

  console.log('✅ PostgreSQL Database seeded successfully with 128 users, matching mockups!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
