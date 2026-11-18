import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for crypto-wallet...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@crypto.dev',
      name: 'Alice Nakamoto',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@crypto.dev',
      name: 'Bob Buterin',
    },
  });

  console.log(`👤 Created Users: ${alice.name} (${alice.id}), ${bob.name} (${bob.id})`);

  // Create Wallets for Alice
  const aliceBtcWallet = await prisma.wallet.create({
    data: {
      userId: alice.id,
      currency: 'BTC',
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      balance: 1.85,
      label: "Alice's Primary Bitcoin Vault",
    },
  });

  const aliceEthWallet = await prisma.wallet.create({
    data: {
      userId: alice.id,
      currency: 'ETH',
      address: '0x71C8360f37ab81675630eA2906d20364f9A24984',
      balance: 15.5,
      label: "Alice's Ethereum DeFi Wallet",
    },
  });

  // Create Wallets for Bob
  const bobEthWallet = await prisma.wallet.create({
    data: {
      userId: bob.id,
      currency: 'ETH',
      address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
      balance: 4.2,
      label: "Bob's Trading ETH",
    },
  });

  const bobUsdtWallet = await prisma.wallet.create({
    data: {
      userId: bob.id,
      currency: 'USDT',
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      balance: 5000.0,
      label: "Bob's USDT Holdings",
    },
  });

  console.log('💼 Created Wallets for Alice and Bob');

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      walletId: aliceBtcWallet.id,
      type: TransactionType.DEPOSIT,
      amount: 1.85,
      status: TransactionStatus.COMPLETED,
      txHash: '0x4f128ab67d8f99e30a84c98e1f0e451b682b141f22e8941785f7a0be96a15712',
      description: 'Initial BTC mining reward deposit',
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: aliceEthWallet.id,
      type: TransactionType.DEPOSIT,
      amount: 20.0,
      status: TransactionStatus.COMPLETED,
      txHash: '0x9d239bca40683a45c22f0367d530184e1b8c0498ef4715aa390234789dfa1204',
      description: 'Exchange purchase deposit',
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: aliceEthWallet.id,
      type: TransactionType.TRANSFER,
      amount: 4.5,
      status: TransactionStatus.COMPLETED,
      txHash: '0xa498112c3fe60183597dcae981203649ba34a6ef902b1894d7612c98bf35a8bc',
      description: 'Transfer ETH to Bob',
    },
  });

  console.log('⚡ Created initial transactions');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
