import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Admin Operations & Profile Management', () => {
  const uid = Date.now().toString().slice(-6);
  const testUsername = `adm_op_${uid}`;
  const recipientUsername = `adm_rec_${uid}`;

  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    await adminService.ensureDefaultAdmin();

    const adminLogin = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;

    await request(app)
      .post('/user')
      .send({
        username: testUsername,
        fullName: 'Admin Op User',
      });

    const user = await prisma.user.findUnique({ where: { username: testUsername } });
    testUserId = user!.id;

    await request(app)
      .post('/user')
      .send({
        username: recipientUsername,
        fullName: 'Admin Op Recipient',
      });
  });

  afterAll(async () => {
    const userIds = (
      await prisma.user.findMany({
        where: { username: { in: [testUsername, recipientUsername] } },
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

  it('POST /admin/users/:id/topup credits funds to user balance', async () => {
    const res = await request(app)
      .post(`/admin/users/${testUserId}/topup`)
      .set('Authorization', adminToken)
      .send({
        amount: 3500,
        notes: 'Admin credit grant',
        attachment: 'data:image/jpeg;base64,sample_test_attachment',
      });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(3500);
    expect(res.body.topupCode).toMatch(/^TOP-/);
    expect(res.body.attachment).toBe('data:image/jpeg;base64,sample_test_attachment');

    const userRes = await request(app)
      .get(`/admin/users/${testUserId}`)
      .set('Authorization', adminToken);
    expect(userRes.body.balance).toBe(3500);
  });

  it('POST /admin/users/:id/topup rejects request without mandatory attachment', async () => {
    const res = await request(app)
      .post(`/admin/users/${testUserId}/topup`)
      .set('Authorization', adminToken)
      .send({
        amount: 1000,
        notes: 'Missing attachment test',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/attachment is required/i);
  });

  it('POST /admin/users/:id/transfer executes admin-directed user transfer', async () => {
    const res = await request(app)
      .post(`/admin/users/${testUserId}/transfer`)
      .set('Authorization', adminToken)
      .send({
        to_username: recipientUsername,
        amount: 1000,
        notes: 'Admin initiated payout',
      });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(1000);
    expect(res.body.senderBalanceAfter).toBe(2500);
  });

  it('GET /admin/profile/:username returns admin details', async () => {
    const res = await request(app)
      .get('/admin/profile/admin')
      .set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('admin');
    expect(res.body.status).toBe('Active');
  });

  it('PATCH /admin/profile/:username updates admin personal details', async () => {
    const res = await request(app)
      .patch('/admin/profile/admin')
      .set('Authorization', adminToken)
      .send({
        fullName: 'Super Administrator',
        phone: '+62 811 8888 9999',
        address: 'Central Jakarta, Indonesia',
      });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Super Administrator');
  });
});
