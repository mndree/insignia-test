import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma.js';

describe('User Profile & Password Management', () => {
  const uid = Date.now().toString().slice(-6);
  const testUser = `prof_user_${uid}`;
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/user')
      .send({
        username: testUser,
        password: 'password123',
        fullName: 'Profile Test User',
        email: `${testUser}@example.com`,
      });
    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { username: { startsWith: `prof_` } },
    });
  });

  it('GET /user/profile requires valid authorization', async () => {
    const res = await request(app).get('/user/profile');
    expect(res.status).toBe(401);
  });

  it('GET /user/profile returns authenticated user details', async () => {
    const res = await request(app)
      .get('/user/profile')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(testUser);
    expect(res.body.fullName).toBe('Profile Test User');
    expect(res.body).toHaveProperty('balance');
  });

  it('PATCH /user/profile updates user biodata', async () => {
    const res = await request(app)
      .patch('/user/profile')
      .set('Authorization', token)
      .send({
        fullName: 'Updated Profile Name',
        phone: '+62 812 9999 8888',
        address: 'Jakarta, Indonesia',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe('Updated Profile Name');
    expect(res.body.user.phone).toBe('+62 812 9999 8888');
  });

  it('PATCH /user/change-password updates password when credentials match', async () => {
    const res = await request(app)
      .patch('/user/change-password')
      .set('Authorization', token)
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
      .set('Authorization', token)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'anotherpassword',
      });

    expect(res.status).toBe(400);
  });
});
