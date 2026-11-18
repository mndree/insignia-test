import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Crypto Wallet API - Stoplight Contract Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceToken: string;
  let bobToken: string;

  const testSuffix = Date.now().toString().slice(-6);
  const aliceUsername = `alice_${testSuffix}`;
  const bobUsername = `bob_${testSuffix}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transfer.deleteMany({
      where: {
        OR: [
          { fromUser: { username: { in: [aliceUsername, bobUsername] } } },
          { toUser: { username: { in: [aliceUsername, bobUsername] } } },
        ],
      },
    });
    await prisma.topup.deleteMany({
      where: {
        user: { username: { in: [aliceUsername, bobUsername] } },
      },
    });
    await prisma.user.deleteMany({
      where: { username: { in: [aliceUsername, bobUsername] } },
    });

    await app.close();
  });

  describe('1. POST /user (Registration)', () => {
    it('should register Alice and return a token with HTTP 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .send({ username: aliceUsername })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      aliceToken = res.body.token;
    });

    it('should register Bob and return a token with HTTP 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .send({ username: bobUsername })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      bobToken = res.body.token;
    });

    it('should fail with HTTP 409 when registering duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ username: aliceUsername })
        .expect(409);
    });

    it('should fail with HTTP 400 when username is missing', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({})
        .expect(400);
    });
  });

  describe('2. POST /topup (Balance Topup)', () => {
    it('should fail with HTTP 401 when Authorization is missing', async () => {
      await request(app.getHttpServer())
        .post('/topup')
        .send({ amount: 100 })
        .expect(401);
    });

    it('should fail with HTTP 400 when amount is not positive', async () => {
      await request(app.getHttpServer())
        .post('/topup')
        .set('Authorization', aliceToken)
        .send({ amount: -50 })
        .expect(400);
    });

    it('should top up Alice balance with 100 and return HTTP 204 with empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/topup')
        .set('Authorization', aliceToken)
        .send({ amount: 100 })
        .expect(204);

      expect(res.body).toEqual({});
    });
  });

  describe('3. GET /balance (Balance Read)', () => {
    it('should fail with HTTP 401 without Authorization', async () => {
      await request(app.getHttpServer())
        .get('/balance')
        .expect(401);
    });

    it('should return HTTP 200 with {"balance": 100} for Alice', async () => {
      const res = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', aliceToken)
        .expect(200);

      expect(res.body).toEqual({ balance: 100 });
    });

    it('should return HTTP 200 with {"balance": 0} for Bob before any transfers', async () => {
      const res = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', bobToken)
        .expect(200);

      expect(res.body).toEqual({ balance: 0 });
    });
  });

  describe('4. POST /transfer (Transfer)', () => {
    it('should fail with HTTP 401 without Authorization', async () => {
      await request(app.getHttpServer())
        .post('/transfer')
        .send({ to_username: bobUsername, amount: 25 })
        .expect(401);
    });

    it('should fail with HTTP 400 when transferring to oneself', async () => {
      await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', aliceToken)
        .send({ to_username: aliceUsername, amount: 10 })
        .expect(400);
    });

    it('should fail with HTTP 404 when recipient does not exist', async () => {
      await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', aliceToken)
        .send({ to_username: 'non_existent_user_9999', amount: 10 })
        .expect(404);
    });

    it('should fail with HTTP 400 when amount exceeds balance', async () => {
      await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', aliceToken)
        .send({ to_username: bobUsername, amount: 500 })
        .expect(400);
    });

    it('should transfer 25 from Alice to Bob and return HTTP 204 with empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', aliceToken)
        .send({ to_username: bobUsername, amount: 25 })
        .expect(204);

      expect(res.body).toEqual({});
    });

    it('should verify Alice balance is now 75', async () => {
      const res = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', aliceToken)
        .expect(200);

      expect(res.body).toEqual({ balance: 75 });
    });

    it('should verify Bob balance is now 25', async () => {
      const res = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', bobToken)
        .expect(200);

      expect(res.body).toEqual({ balance: 25 });
    });
  });

  describe('5. GET /top_transactions_per_user', () => {
    it('should fail with HTTP 401 without Authorization', async () => {
      await request(app.getHttpServer())
        .get('/top_transactions_per_user')
        .expect(401);
    });

    it('should return counterparty Bob with negative amount (-25) for Alice', async () => {
      const res = await request(app.getHttpServer())
        .get('/top_transactions_per_user')
        .set('Authorization', aliceToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([
        {
          username: bobUsername,
          amount: -25,
        },
      ]);
    });

    it('should return counterparty Alice with positive amount (25) for Bob', async () => {
      const res = await request(app.getHttpServer())
        .get('/top_transactions_per_user')
        .set('Authorization', bobToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([
        {
          username: aliceUsername,
          amount: 25,
        },
      ]);
    });
  });

  describe('6. GET /top_users', () => {
    it('should fail with HTTP 401 without Authorization', async () => {
      await request(app.getHttpServer())
        .get('/top_users')
        .expect(401);
    });

    it('should return Alice with transacted_value 25 and exclude Bob who made no outgoing transfers', async () => {
      const res = await request(app.getHttpServer())
        .get('/top_users')
        .set('Authorization', aliceToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const aliceEntry = res.body.find((item: any) => item.username === aliceUsername);
      expect(aliceEntry).toBeDefined();
      expect(aliceEntry.transacted_value).toBe(25);

      const bobEntry = res.body.find((item: any) => item.username === bobUsername);
      expect(bobEntry).toBeUndefined(); // Bob has 0 outgoing transfers, must be excluded
    });
  });

  describe('7. Admin Login & Bearer Token Authorization', () => {
    let adminToken: string;

    it('should login as default admin and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('admin');
      expect(res.body.admin.username).toBe('admin');
      adminToken = res.body.token;
    });

    it('should fail with HTTP 401 when logging in with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/admin/login')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);
    });

    it('should allow Admin to read balance using "Authorization: Bearer <adminToken>"', async () => {
      const res = await request(app.getHttpServer())
        .get('/balance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('balance');
      expect(typeof res.body.balance).toBe('number');
    });

    it('should allow Admin to topup using "Authorization: Bearer <adminToken>"', async () => {
      await request(app.getHttpServer())
        .post('/topup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50 })
        .expect(204);
    });

    it('should allow Admin to transfer using "Authorization: Bearer <adminToken>"', async () => {
      await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ to_username: bobUsername, amount: 10 })
        .expect(204);
    });

    it('should allow Admin to list top users using "Authorization: Bearer <adminToken>"', async () => {
      const res = await request(app.getHttpServer())
        .get('/top_users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const adminEntry = res.body.find((u: any) => u.username === 'admin');
      expect(adminEntry).toBeDefined();
      expect(adminEntry.transacted_value).toBeGreaterThanOrEqual(10);
    });
  });
});
