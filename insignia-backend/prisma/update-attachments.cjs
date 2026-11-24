const { PrismaClient } = require('@prisma/client');
const receipt = require('./receiptBase64.json');
const prisma = new PrismaClient();

async function run() {
  const res = await prisma.topup.updateMany({
    data: { attachment: receipt.receiptBase64 }
  });
  console.log(`Successfully updated ${res.count} existing topup records with attachment.`);
}

run()
  .catch((err) => {
    console.error('Error updating topup attachments:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
