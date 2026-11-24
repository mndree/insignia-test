import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import receiptData from './receiptBase64.json';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Insignia Wallet...');

  // 1. Clean existing records in correct foreign key order
  await prisma.transfer.deleteMany();
  await prisma.topup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  console.log('🧹 Cleaned existing tables (admins, users, transfers, topups).');

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('PassWord!@#123', 10);

  // 3. Seed Admin Table (EXACTLY 1 DATA)
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      password: adminPasswordHash,
      fullName: 'System Administrator',
      email: 'admin@insignia.wallet',
      phone: '+62 811 0000 1111',
      dateOfBirth: '15/05/1990',
      gender: 'Male',
      address: 'Central Jakarta, Indonesia',
    },
  });
  console.log(`✅ Seeded 1 Admin: ${admin.username} (password: admin123)`);

  // 4. Seed Users Table (EXACTLY 10 DATA, all with password "PassWord!@#123")
  const userData = [
    {
      userCode: 'USR-0001',
      username: 'andre',
      fullName: 'Andre Juliansyah',
      email: 'juliansyahmandree@gmail.com',
      phone: '+62 878 4388 0148',
      dateOfBirth: '22/10/1999',
      gender: 'Male',
      address: 'Apartemen Belmont Residence Tower Mont Blanc Unit 1901, Jl. Kebon Jeruk Indah Utama No.8, RT.8/RW.7',
      status: 'Active',
      password: userPasswordHash,
      balance: 19500,
      createdAt: new Date('2026-11-01T08:00:00Z'),
    },
    {
      userCode: 'USR-0002',
      username: 'azra',
      fullName: 'Azra Putri',
      email: 'azra.putri@example.com',
      phone: '+62 813 9876 5432',
      dateOfBirth: '22/08/1998',
      gender: 'Female',
      address: 'Jl. Dago No. 124, Bandung, Jawa Barat',
      status: 'Active',
      password: userPasswordHash,
      balance: 15000,
      createdAt: new Date('2026-11-02T09:30:00Z'),
    },
    {
      userCode: 'USR-0003',
      username: 'raka',
      fullName: 'Raka Feisal',
      email: 'raka.feisal@example.com',
      phone: '+62 811 2345 6789',
      dateOfBirth: '10/02/1995',
      gender: 'Male',
      address: 'Jl. Pemuda No. 45, Surabaya, Jawa Timur',
      status: 'Active',
      password: userPasswordHash,
      balance: 19000,
      createdAt: new Date('2026-11-03T10:15:00Z'),
    },
    {
      userCode: 'USR-0004',
      username: 'alice',
      fullName: 'Alice Morgan',
      email: 'alice.morgan@example.com',
      phone: '+1 415 555 0192',
      dateOfBirth: '03/12/1994',
      gender: 'Female',
      address: '742 Market St, San Francisco, CA 94102, USA',
      status: 'Active',
      password: userPasswordHash,
      balance: 9500,
      createdAt: new Date('2026-11-04T11:00:00Z'),
    },
    {
      userCode: 'USR-0005',
      username: 'bob',
      fullName: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+44 20 7946 0912',
      dateOfBirth: '17/07/1993',
      gender: 'Male',
      address: '10 Downing St, London SW1A 2AA, UK',
      status: 'Active',
      password: userPasswordHash,
      balance: 9000,
      createdAt: new Date('2026-11-05T12:45:00Z'),
    },
    {
      userCode: 'USR-0006',
      username: 'charlie',
      fullName: 'Charlie Lee',
      email: 'charlie.lee@example.com',
      phone: '+65 9123 4567',
      dateOfBirth: '29/10/1991',
      gender: 'Male',
      address: '25 Marina Bay Financial Centre, Singapore 018981',
      status: 'Active',
      password: userPasswordHash,
      balance: 25000,
      createdAt: new Date('2026-11-06T13:20:00Z'),
    },
    {
      userCode: 'USR-0007',
      username: 'david',
      fullName: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+82 10 1234 5678',
      dateOfBirth: '14/04/1997',
      gender: 'Male',
      address: '123 Teheran-ro, Gangnam-gu, Seoul, South Korea',
      status: 'Active',
      password: userPasswordHash,
      balance: 11000,
      createdAt: new Date('2026-11-07T14:10:00Z'),
    },
    {
      userCode: 'USR-0008',
      username: 'elena',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+33 1 4268 5500',
      dateOfBirth: '08/09/1996',
      gender: 'Female',
      address: '14 Rue de Rivoli, 75004 Paris, France',
      status: 'Active',
      password: userPasswordHash,
      balance: 17000,
      createdAt: new Date('2026-11-08T15:00:00Z'),
    },
    {
      userCode: 'USR-0009',
      username: 'fiona',
      fullName: 'Fiona Gallagher',
      email: 'fiona.gallagher@example.com',
      phone: '+1 312 555 0144',
      dateOfBirth: '21/01/1998',
      gender: 'Female',
      address: '2119 S Michigan Ave, Chicago, IL 60616, USA',
      status: 'Active',
      password: userPasswordHash,
      balance: 13000,
      createdAt: new Date('2026-11-09T16:30:00Z'),
    },
    {
      userCode: 'USR-0010',
      username: 'george',
      fullName: 'George Clark',
      email: 'george.clark@example.com',
      phone: '+61 2 9374 4000',
      dateOfBirth: '05/06/1992',
      gender: 'Male',
      address: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
      status: 'Inactive',
      password: userPasswordHash,
      balance: 11000,
      createdAt: new Date('2026-11-10T17:00:00Z'),
    },
  ];

  const userMap = new Map<string, any>();

  for (const u of userData) {
    const created = await prisma.user.create({ data: u });
    userMap.set(u.username, created);
  }
  console.log(`✅ Seeded ${userMap.size} Users (all with password: PassWord!@#123).`);

  // 5. Seed Topups (Realistic funding records)
  // Total topups = 25k + 15k + 20k + 10k + 8k + 30k + 12k + 14k + 10k + 5k = 149,000 units
  const topupsData = [
    { username: 'andre', amount: 25000, notes: 'Initial wallet balance top-up', date: '2026-11-11T10:00:00Z' },
    { username: 'azra', amount: 15000, notes: 'Welcome bonus credit', date: '2026-11-12T10:30:00Z' },
    { username: 'raka', amount: 20000, notes: 'Corporate expense allowance', date: '2026-11-12T11:00:00Z' },
    { username: 'alice', amount: 10000, notes: 'Admin wallet deposit grant', date: '2026-11-13T09:15:00Z' },
    { username: 'bob', amount: 8000, notes: 'Trading starter balance', date: '2026-11-14T14:20:00Z' },
    { username: 'charlie', amount: 30000, notes: 'Institutional liquidity provision', date: '2026-11-15T15:00:00Z' },
    { username: 'david', amount: 12000, notes: 'Direct wallet credit', date: '2026-11-16T08:45:00Z' },
    { username: 'elena', amount: 14000, notes: 'Platform promotional reward', date: '2026-11-17T13:10:00Z' },
    { username: 'fiona', amount: 10000, notes: 'Initial account funding', date: '2026-11-18T16:00:00Z' },
    { username: 'george', amount: 5000, notes: 'Trial balance credit', date: '2026-11-19T11:30:00Z' },
  ];

  let topupCounter = 1;
  for (const t of topupsData) {
    const user = userMap.get(t.username);
    if (user) {
      await prisma.topup.create({
        data: {
          topupCode: `TOP-${String(topupCounter++).padStart(4, '0')}`,
          userId: user.id,
          amount: t.amount,
          notes: t.notes,
          attachment: receiptData.receiptBase64,
          createdBy: 'admin',
          createdAt: new Date(t.date),
        },
      });
    }
  }
  console.log(`✅ Seeded ${topupsData.length} Topup records.`);

  // 6. Seed Transfers (Realistic P2P volume distribution)
  const transfersData = [
    { from: 'andre', to: 'azra', amount: 5000, notes: 'Invoice settlement #INV-2026-01', date: '2026-11-19T14:00:00Z' },
    { from: 'andre', to: 'raka', amount: 2500, notes: 'Development sprint payment', date: '2026-11-20T09:30:00Z' },
    { from: 'andre', to: 'alice', amount: 1000, notes: 'Design asset fee', date: '2026-11-20T11:15:00Z' },
    { from: 'charlie', to: 'andre', amount: 3000, notes: 'Consulting services reimbursement', date: '2026-11-20T16:45:00Z' },
    { from: 'azra', to: 'bob', amount: 3000, notes: 'Content creation payout', date: '2026-11-21T10:00:00Z' },
    { from: 'azra', to: 'raka', amount: 2000, notes: 'Cloud infrastructure share', date: '2026-11-21T13:20:00Z' },
    { from: 'raka', to: 'charlie', amount: 4000, notes: 'API server integration settlement', date: '2026-11-21T15:30:00Z' },
    { from: 'raka', to: 'david', amount: 1500, notes: 'Localization translation fee', date: '2026-11-22T08:15:00Z' },
    { from: 'alice', to: 'elena', amount: 1500, notes: 'Marketing campaign distribution', date: '2026-11-22T10:45:00Z' },
    { from: 'bob', to: 'fiona', amount: 2000, notes: 'Video editing freelance fee', date: '2026-11-22T12:00:00Z' },
    { from: 'charlie', to: 'george', amount: 6000, notes: 'Hardware procurement advance', date: '2026-11-22T14:30:00Z' },
    { from: 'david', to: 'elena', amount: 2500, notes: 'Smart contract security review', date: '2026-11-23T09:00:00Z' },
    { from: 'elena', to: 'fiona', amount: 1000, notes: 'Social media management payout', date: '2026-11-23T11:20:00Z' },
  ];

  let transferCounter = 1;
  for (const tx of transfersData) {
    const sender = userMap.get(tx.from);
    const recipient = userMap.get(tx.to);
    if (sender && recipient) {
      await prisma.transfer.create({
        data: {
          transferCode: `TX-${String(transferCounter++).padStart(4, '0')}`,
          fromUserId: sender.id,
          toUserId: recipient.id,
          amount: tx.amount,
          notes: tx.notes,
          description: tx.notes,
          createdAt: new Date(tx.date),
          updatedAt: new Date(tx.date),
        },
      });
    }
  }
  console.log(`✅ Seeded ${transfersData.length} Transfer records.`);

  // 7. Verification Summary
  const countAdmins = await prisma.admin.count();
  const countUsers = await prisma.user.count();
  const countTopups = await prisma.topup.count();
  const countTransfers = await prisma.transfer.count();
  const sumBalance = await prisma.user.aggregate({ _sum: { balance: true } });

  console.log('====================================================');
  console.log(`✨ DATABASE SEED COMPLETED SUCCESSFULLY:`);
  console.log(`   - Admins count:    ${countAdmins} (Expected: 1)`);
  console.log(`   - Users count:     ${countUsers} (Expected: 10)`);
  console.log(`   - Topups count:    ${countTopups}`);
  console.log(`   - Transfers count: ${countTransfers}`);
  console.log(`   - Total Users Bal: ${sumBalance._sum.balance} units`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
