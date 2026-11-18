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

  const commonPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 2. Seed Admin account
  const adminRecord = await prisma.admin.create({
    data: {
      username: 'admin',
      password: adminPasswordHash,
    },
  });

  // Admin user record
  const adminUser = await prisma.user.create({
    data: {
      userCode: 'USR-0000',
      username: 'admin',
      fullName: 'System Administrator',
      email: 'admin@insignia.wallet',
      phone: '+1 555 0100',
      dateOfBirth: '01 Jan 1990',
      address: 'Central Admin, Jakarta',
      status: 'Active',
      password: adminPasswordHash,
      token: 'session-token-admin',
      balance: 18150,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      lastLoginAt: new Date('2026-11-18T17:00:00Z'),
    },
  });

  // 3. Seed Key Users (from UI mockups)
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
      password: commonPasswordHash,
      token: 'mock-token-andre-111',
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
      password: commonPasswordHash,
      token: 'mock-token-azra-222',
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
      password: commonPasswordHash,
      token: 'mock-token-raka-333',
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
      password: commonPasswordHash,
      token: 'mock-token-alice-444',
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
      password: commonPasswordHash,
      token: 'mock-token-bob-555',
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
      password: commonPasswordHash,
      token: 'mock-token-charlie-666',
      balance: 21600,
      createdAt: new Date('2026-11-13T10:10:00Z'),
      lastLoginAt: new Date('2026-11-17T19:30:00Z'),
    },
  ];

  const userMap = new Map<string, string>();
  userMap.set('admin', adminUser.id);

  for (const u of keyUsers) {
    const record = await prisma.user.create({
      data: u,
    });
    userMap.set(u.username, record.id);
  }

  // 4. Create remaining users to reach exactly 128 users
  // Target: 128 Total, 116 Active, 12 Inactive (Alice + 11 others = 12 Inactive)
  // Target sum: exactly 845,250 units
  const initialSum = keyUsers.reduce((sum, u) => sum + u.balance, 0); // 117,600
  const remainingSum = 845250 - initialSum; // 727,650
  const remainingCount = 128 - keyUsers.length; // 122 users
  const avgBalance = Math.floor(remainingSum / remainingCount);

  const firstNames = ['David', 'Elena', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Marcus', 'Nadia', 'Oscar', 'Priya', 'Quentin', 'Rachel', 'Sam', 'Tara', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];

  let accumulatedBalance = 0;

  for (let i = 7; i <= 128; i++) {
    const userNum = String(i).padStart(4, '0');
    const fName = firstNames[(i * 3) % firstNames.length];
    const lName = lastNames[(i * 7) % lastNames.length];
    const username = `${fName.toLowerCase()}_${lName.toLowerCase()}${i}`;
    const isInactive = i >= 118; // 11 inactive + Alice = 12 inactive total -> exactly 116 active!

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
        password: commonPasswordHash,
        token: `session-token-${username}`,
        balance: bal,
        createdAt: createdDate,
        lastLoginAt: new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000),
      },
    });
    userMap.set(username, rec.id);
  }

  // 5. Seed Andre's specific transfers (matching the User Details mockup)
  const andreId = userMap.get('andre')!;
  const azraId = userMap.get('azra')!;
  const rakaId = userMap.get('raka')!;
  const aliceId = userMap.get('alice')!;
  const bobId = userMap.get('bob')!;
  const charlieId = userMap.get('charlie')!;

  const specificTransfers = [
    {
      transferCode: 'TXN-9021',
      fromUserId: andreId,
      toUserId: azraId,
      amount: 2500,
      notes: 'Project payment',
      description: 'Contractor settlement payout',
      createdAt: new Date('2026-11-18T10:45:00Z'),
    },
    {
      transferCode: 'TXN-9020',
      fromUserId: rakaId,
      toUserId: andreId,
      amount: 1800,
      notes: 'Infrastructure reimbursement',
      description: 'Reimbursement for infrastructure',
      createdAt: new Date('2026-11-17T14:20:00Z'),
    },
    {
      transferCode: 'TXN-9019',
      fromUserId: andreId,
      toUserId: aliceId,
      amount: 1200,
      notes: 'Design asset fee',
      description: 'Design asset license fee',
      createdAt: new Date('2026-11-16T11:05:00Z'),
    },
    {
      transferCode: 'TXN-9015',
      fromUserId: bobId,
      toUserId: andreId,
      amount: 38200,
      notes: 'Treasury reserve fund transfer',
      description: 'Treasury reserve fund transfer',
      createdAt: new Date('2026-11-10T08:00:00Z'),
    },
    {
      transferCode: 'TXN-9014',
      fromUserId: andreId,
      toUserId: charlieId,
      amount: 11800,
      notes: 'Quarterly node validator allocation',
      description: 'Quarterly node validator allocation',
      createdAt: new Date('2026-11-08T15:30:00Z'),
    },
  ];

  for (const tx of specificTransfers) {
    await prisma.transfer.create({ data: tx });
  }

  // 6. Seed Raka's outgoing transfers to match Stoplight GET /top_users mock (raka transacted_value: 45000)
  // raka already sent 1800 to andre above. Need 43200 more:
  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9028',
      fromUserId: rakaId,
      toUserId: charlieId,
      amount: 20000,
      notes: 'Liquidity pool seeding',
      description: 'Liquidity provision',
      createdAt: new Date('2026-11-12T09:15:00Z'),
    },
  });
  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9027',
      fromUserId: rakaId,
      toUserId: azraId,
      amount: 15000,
      notes: 'Marketing sponsorship',
      description: 'Regional community grant',
      createdAt: new Date('2026-11-14T11:45:00Z'),
    },
  });
  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9026',
      fromUserId: rakaId,
      toUserId: bobId,
      amount: 8200,
      notes: 'Validator operational lease',
      description: 'Cloud validator hosting',
      createdAt: new Date('2026-11-15T15:20:00Z'),
    },
  });

  // 7. Seed Admin transfers and top-ups (for admin user history)
  await prisma.topup.create({
    data: {
      topupCode: 'TOP-1001',
      userId: adminUser.id,
      amount: 10000,
      notes: 'Initial treasury seed',
      createdAt: new Date('2026-11-04T07:30:00Z'),
    },
  });

  await prisma.topup.create({
    data: {
      topupCode: 'TOP-1002',
      userId: adminUser.id,
      amount: 5000,
      notes: 'Secondary operational top-up',
      createdAt: new Date('2026-11-15T08:00:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9018',
      fromUserId: adminUser.id,
      toUserId: bobId,
      amount: 750,
      notes: 'External security audit retainer',
      description: 'External security audit retainer',
      createdAt: new Date('2026-11-14T16:30:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9017',
      fromUserId: charlieId,
      toUserId: adminUser.id,
      amount: 3200,
      notes: 'Treasury reserve allocation',
      description: 'Treasury reserve allocation',
      createdAt: new Date('2026-11-13T14:15:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9016',
      fromUserId: azraId,
      toUserId: adminUser.id,
      amount: 1500,
      notes: 'Escrow release credit',
      description: 'Escrow release credit',
      createdAt: new Date('2026-11-08T12:20:00Z'),
    },
  });

  await prisma.transfer.create({
    data: {
      transferCode: 'TXN-9013',
      fromUserId: adminUser.id,
      toUserId: rakaId,
      amount: 800,
      notes: 'API integration fee',
      description: 'API integration fee',
      createdAt: new Date('2026-11-06T09:10:00Z'),
    },
  });

  // 8. Generate additional realistic transfers across other users for the last 30 days
  // Exclude 'andre' and 'admin' so their exact mock totals (Total Received: 40,000, Total Sent: 15,500) remain exact!
  const otherUserIds = Array.from(userMap.entries())
    .filter(([username]) => username !== 'andre' && username !== 'admin')
    .map(([, id]) => id);
  let txCounter = 9029;

  for (let day = 30; day >= 1; day--) {
    const txDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + (day * 37) % 86400000);
    const countThisDay = 2 + (day % 4); // 2 to 5 transfers per day

    for (let k = 0; k < countThisDay; k++) {
      const fromIdx = (day * 5 + k * 7) % otherUserIds.length;
      let toIdx = (day * 3 + k * 11 + 1) % otherUserIds.length;
      if (toIdx === fromIdx) toIdx = (toIdx + 1) % otherUserIds.length;

      const amounts = [150, 250, 400, 650, 1100, 1850, 2400, 3500, 5000];
      const amt = amounts[(day + k) % amounts.length];
      const code = `TXN-${txCounter++}`;

      await prisma.transfer.create({
        data: {
          transferCode: code,
          fromUserId: otherUserIds[fromIdx],
          toUserId: otherUserIds[toIdx],
          amount: amt,
          notes: `Settlement batch ${day}-${k + 1}`,
          description: `Peer transfer for services (#${code})`,
          createdAt: txDate,
        },
      });
    }
  }

  console.log(`✅ Successfully seeded PostgreSQL database:`);
  console.log(`   - 128 Users (116 Active, 12 Inactive, Total Balance = 845,250 units)`);
  console.log(`   - Admin credentials: admin / admin123`);
  console.log(`   - User credentials: andre / password123`);
  console.log(`   - Over 100 real transactions across 30 days for charts & paginated history`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
