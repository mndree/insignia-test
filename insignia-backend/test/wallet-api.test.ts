import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Wallet REST API Endpoints', () => {
  const uid = Date.now().toString().slice(-6);
  const senderUsername = `sender_${uid}`;
  const recipientUsername = `recipient_${uid}`;

  let senderToken: string;
  let recipientToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await adminService.ensureDefaultAdmin();

    // Login default admin to acquire admin token
    const adminLogin = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Register sender user
    const senderRes = await request(app)
      .post('/user')
      .send({
        username: senderUsername,
        password: 'password123',
        fullName: 'Test Sender',
        email: `${senderUsername}@example.com`,
      });
    senderToken = senderRes.body.token;

    // Register recipient user
    const recipientRes = await request(app)
      .post('/user')
      .send({
        username: recipientUsername,
        password: 'password123',
        fullName: 'Test Recipient',
        email: `${recipientUsername}@example.com`,
      });
    recipientToken = recipientRes.body.token;
  });

  afterAll(async () => {
    // Cleanup created test records
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

  describe('User Registration & Availability Endpoints', () => {
    it('POST /user registers a new user with code and token', async () => {
      const tempUser = `temp_${Date.now().toString().slice(-5)}`;
      const res = await request(app)
        .post('/user')
        .send({ username: tempUser, fullName: 'Temp User' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');

      // Cleanup
      await prisma.user.deleteMany({ where: { username: tempUser } });
    });

    it('POST /user rejects duplicate username with 409 Conflict', async () => {
      const res = await request(app)
        .post('/user')
        .send({ username: senderUsername });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
    });

    it('POST /user rejects missing or empty username with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/user')
        .send({ username: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('GET /user/check-username/:username returns available: true for non-existent user', async () => {
      const res = await request(app).get(`/user/check-username/available_${Date.now()}`);
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
      expect(res.body.exists).toBe(false);
    });

    it('GET /user/check-username/:username returns available: false for existing user', async () => {
      const res = await request(app).get(`/user/check-username/${senderUsername}`);
      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.exists).toBe(true);
    });

    it('POST /user/check-username also checks availability via body', async () => {
      const res = await request(app)
        .post('/user/check-username')
        .send({ username: recipientUsername });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
    });
  });

  describe('User Profile & Password Management', () => {
    it('GET /user/profile requires valid authorization', async () => {
      const res = await request(app).get('/user/profile');
      expect(res.status).toBe(401);
    });

    it('GET /user/profile returns authenticated user details', async () => {
      const res = await request(app)
        .get('/user/profile')
        .set('Authorization', senderToken);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(senderUsername);
      expect(res.body.fullName).toBe('Test Sender');
      expect(res.body).toHaveProperty('balance');
    });

    it('PATCH /user/profile updates user biodata', async () => {
      const res = await request(app)
        .patch('/user/profile')
        .set('Authorization', senderToken)
        .send({
          fullName: 'Updated Sender Name',
          phone: '+62 812 9999 8888',
          address: 'Jakarta, Indonesia',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.fullName).toBe('Updated Sender Name');
      expect(res.body.user.phone).toBe('+62 812 9999 8888');
    });

    it('PATCH /user/change-password updates password when credentials match', async () => {
      const res = await request(app)
        .patch('/user/change-password')
        .set('Authorization', senderToken)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed successfully');
    });

    it('PATCH /user/change-password rejects incorrect current password', async () => {
      const res = await request(app)
        .patch('/user/change-password')
        .set('Authorization', senderToken)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'anotherpassword',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Balance, Top Up & Transfer Operations', () => {
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
      const senderUser = await prisma.user.findUnique({ where: { username: senderUsername } });
      const res = await request(app)
        .post(`/admin/users/${senderUser!.id}/topup`)
        .set('Authorization', adminToken)
        .send({ amount: 5000, notes: 'Initial test funding' });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(5000);

      // Verify balance updated
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

      // Verify sender balance decremented (5000 - 1500 = 3500)
      const senderBalanceRes = await request(app)
        .get('/balance')
        .set('Authorization', senderToken);
      expect(senderBalanceRes.body.balance).toBe(3500);

      // Verify recipient balance incremented (0 + 1500 = 1500)
      const recipientBalanceRes = await request(app)
        .get('/balance')
        .set('Authorization', recipientToken);
      expect(recipientBalanceRes.body.balance).toBe(1500);
    });
  });

  describe('Transaction History & Counterparty Analytics', () => {
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
});
