import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { adminService } from '../src/services/admin.service.js';

describe('Authentication & Login Aliases', () => {
  beforeAll(async () => {
    await adminService.ensureDefaultAdmin();
  });

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
