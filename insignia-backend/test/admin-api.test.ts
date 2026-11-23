import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Admin REST API Endpoints', () => {
  const uid = Date.now().toString().slice(-6);
  const testUsername = `user_admin_${uid}`;
  const recipientUsername = `rec_admin_${uid}`;

  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    await adminService.ensureDefaultAdmin();

    const adminLogin = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;

    const userRes = await request(app)
      .post('/user')
      .send({
        username: testUsername,
        fullName: 'Admin Test User',
        email: `${testUsername}@example.com`,
      });

    const user = await prisma.user.findUnique({ where: { username: testUsername } });
    testUserId = user!.id;

    await request(app)
      .post('/user')
      .send({
        username: recipientUsername,
        fullName: 'Admin Recipient User',
        email: `${recipientUsername}@example.com`,
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

  describe('Authentication & Aliases', () => {
    it('POST /admin/login authenticates valid credentials and returns admin token', async () => {
      const res = await request(app)
        .post('/admin/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('POST /auth/login alias authenticates credentials identically', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('admin');
    });

    it('POST /admin/login rejects invalid credentials with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/admin/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('User Management & Directory Endpoints', () => {
    it('GET /admin/users returns paginated users with aggregate stats', async () => {
      const res = await request(app)
        .get('/admin/users?page=1&pageSize=10')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('totalUsers');
      expect(res.body.stats).toHaveProperty('activeUsers');
      expect(res.body.stats).toHaveProperty('totalWalletBalance');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('GET /admin/users filters results by search term', async () => {
      const res = await request(app)
        .get(`/admin/users?search=${testUsername}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].username).toBe(testUsername);
    });

    it('GET /admin/users/:id returns user details by id or username', async () => {
      const res = await request(app)
        .get(`/admin/users/${testUserId}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(testUsername);
      expect(res.body.fullName).toBe('Admin Test User');
    });

    it('GET /admin/users/:id returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/admin/users/non_existent_id_9999')
        .set('Authorization', adminToken);

      expect(res.status).toBe(404);
    });

    it('PATCH /admin/users/:id updates user details and status', async () => {
      const res = await request(app)
        .patch(`/admin/users/${testUserId}`)
        .set('Authorization', adminToken)
        .send({
          fullName: 'Modified Admin Test User',
          phone: '+62 811 0000 1111',
          status: 'Active',
          balance: 3000,
        });

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Modified Admin Test User');
      expect(Number(res.body.balance)).toBe(3000);
    });
  });

  describe('Admin Balance Adjustments & Transfers', () => {
    it('POST /admin/users/:id/topup credits funds to user balance', async () => {
      const res = await request(app)
        .post(`/admin/users/${testUserId}/topup`)
        .set('Authorization', adminToken)
        .send({
          amount: 2500,
          notes: 'Admin credit grant',
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(2500);

      // Verify balance increased by 2500 (3000 + 2500 = 5500)
      const userRes = await request(app)
        .get(`/admin/users/${testUserId}`)
        .set('Authorization', adminToken);
      expect(userRes.body.balance).toBe(5500);
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
      expect(res.body.senderBalanceAfter).toBe(4500);
    });
  });

  describe('Admin Profile Management', () => {
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
});
