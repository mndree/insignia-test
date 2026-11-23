import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';

describe('User Registration & Username Availability', () => {
  const uid = Date.now().toString().slice(-6);
  const testUser = `reg_user_${uid}`;

  beforeAll(async () => {
    await request(app)
      .post('/user')
      .send({
        username: testUser,
        fullName: 'Registration Test User',
        email: `${testUser}@example.com`,
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { username: { startsWith: `reg_` } },
    });
  });

  it('POST /user registers a new user with code and token', async () => {
    const tempUser = `reg_temp_${Date.now().toString().slice(-5)}`;
    const res = await request(app)
      .post('/user')
      .send({ username: tempUser, fullName: 'Temp User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');

    await prisma.user.deleteMany({ where: { username: tempUser } });
  });

  it('POST /user rejects duplicate username with 409 Conflict', async () => {
    const res = await request(app)
      .post('/user')
      .send({ username: testUser });

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
    const res = await request(app).get(`/user/check-username/${testUser}`);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.exists).toBe(true);
  });

  it('POST /user/check-username also checks availability via body', async () => {
    const res = await request(app)
      .post('/user/check-username')
      .send({ username: testUser });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });
});
