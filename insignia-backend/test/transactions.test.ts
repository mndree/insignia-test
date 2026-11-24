import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Transaction History & Counterparty Analytics', () => {
  const uid = Date.now().toString().slice(-6);
  const senderUsername = `tx_snd_${uid}`;
  const recipientUsername = `tx_rec_${uid}`;

  let senderToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await adminService.ensureDefaultAdmin();

    const adminLogin = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;

    const senderRes = await request(app)
      .post('/user')
      .send({
        username: senderUsername,
        password: 'password123',
        fullName: 'Tx Sender',
      });
    senderToken = senderRes.body.token;

    await request(app)
      .post('/user')
      .send({
        username: recipientUsername,
        password: 'password123',
        fullName: 'Tx Recipient',
      });

    const senderUser = await prisma.user.findUnique({ where: { username: senderUsername } });

    // Credit sender and make a transfer
    await request(app)
      .post(`/admin/users/${senderUser!.id}/topup`)
      .set('Authorization', adminToken)
      .send({ amount: 5000, attachment: 'data:image/jpeg;base64,sample_test_attachment' });

    await request(app)
      .post('/transfer')
      .set('Authorization', senderToken)
      .send({
        to_username: recipientUsername,
        amount: 1500,
      });
  });

  afterAll(async () => {
    const userIds = (
      await prisma.user.findMany({
        where: { username: { in: [senderUsername, recipientUsername] } },
        select: { id: true },
      })
    ).map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.transfer.deleteMany({
        where: {
          OR: [{ fromUserId: { in: userIds } }, { toUserId: { in: userIds } }],
        },
      });
      await prisma.topup.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  });

  it('GET /top_transactions_per_user returns counterparty volume ranking', async () => {
    const res = await request(app)
      .get('/top_transactions_per_user')
      .set('Authorization', senderToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const counterparty = res.body.find((item: any) => item.username === recipientUsername);
    expect(counterparty).toBeDefined();
    expect(counterparty.amount).toBe(-1500);
  });

  it('GET /top_users returns global outgoing volume leaderboard', async () => {
    const res = await request(app)
      .get('/top_users')
      .set('Authorization', senderToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('username');
    expect(res.body[0]).toHaveProperty('transacted_value');
    expect(typeof res.body[0].transacted_value).toBe('number');
  });

  it('GET /transactions returns paginated transaction history for user', async () => {
    const res = await request(app)
      .get('/transactions?page=1&pageSize=10')
      .set('Authorization', senderToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);

    const latestTx = res.body.items[0];
    expect(latestTx).toHaveProperty('id');
    expect(latestTx).toHaveProperty('amount');
    expect(latestTx).toHaveProperty('username');
  });
});
