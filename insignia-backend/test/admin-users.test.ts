import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import { adminService } from '../src/services/admin.service.js';

describe('Admin User Directory & Management', () => {
  const uid = Date.now().toString().slice(-6);
  const testUsername = `adm_usr_${uid}`;

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
        fullName: 'Admin Test User',
        email: `${testUsername}@example.com`,
      });

    const user = await prisma.user.findUnique({ where: { username: testUsername } });
    testUserId = user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.transfer.deleteMany({
        where: {
          OR: [{ fromUserId: testUserId }, { toUserId: testUserId }],
        },
      });
      await prisma.topup.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

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
