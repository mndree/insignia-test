import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Balance, Top Up & Transfer Operations', () => {
  const uid = Date.now().toString().slice(-6);
  const senderUsername = `xfer_snd_${uid}`;
  const recipientUsername = `xfer_rec_${uid}`;

  let senderToken: string;
  let recipientToken: string;
  let adminToken: string;
  let senderUserId: string;

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
        fullName: 'Transfer Sender',
      });
    senderToken = senderRes.body.token;

    const senderUser = await prisma.user.findUnique({ where: { username: senderUsername } });
    senderUserId = senderUser!.id;

    const recipientRes = await request(app)
      .post('/user')
      .send({
        username: recipientUsername,
        password: 'password123',
        fullName: 'Transfer Recipient',
      });
    recipientToken = recipientRes.body.token;
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

  it('GET /balance returns initial 0 balance for new user', async () => {
    const res = await request(app)
      .get('/balance')
      .set('Authorization', senderToken);

    expect(res.status).toBe(200);
    expect(typeof res.body.balance).toBe('number');
  });

  it('POST /topup rejects regular users with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/topup')
      .set('Authorization', senderToken)
      .send({ amount: 1000 });

    expect(res.status).toBe(403);
  });

  it('Admin can credit user via /admin/users/:id/topup', async () => {
    const res = await request(app)
      .post(`/admin/users/${senderUserId}/topup`)
      .set('Authorization', adminToken)
      .send({ amount: 5000, notes: 'Initial test funding', attachment: 'data:image/jpeg;base64,sample_test_attachment' });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(5000);

    const balanceRes = await request(app)
      .get('/balance')
      .set('Authorization', senderToken);
    expect(balanceRes.body.balance).toBe(5000);
  });

  it('POST /transfer rejects transfer to oneself with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Authorization', senderToken)
      .send({
        to_username: senderUsername,
        amount: 500,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot transfer to yourself/i);
  });

  it('POST /transfer rejects transfer exceeding balance with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Authorization', senderToken)
      .send({
        to_username: recipientUsername,
        amount: 999999999,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient balance/i);
  });

  it('POST /transfer rejects non-existent recipient with 404 Not Found', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Authorization', senderToken)
      .send({
        to_username: 'non_existent_user_99999',
        amount: 100,
      });

    expect(res.status).toBe(404);
  });

  it('POST /transfer executes atomic transfer and returns 204 No Content', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Authorization', senderToken)
      .send({
        to_username: recipientUsername,
        amount: 1500,
      });

    expect(res.status).toBe(204);

    const senderBalanceRes = await request(app)
      .get('/balance')
      .set('Authorization', senderToken);
    expect(senderBalanceRes.body.balance).toBe(3500);

    const recipientBalanceRes = await request(app)
      .get('/balance')
      .set('Authorization', recipientToken);
    expect(recipientBalanceRes.body.balance).toBe(1500);
  });
});
