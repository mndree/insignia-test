import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('General Application Routing & Error Handling', () => {
  it('GET / redirects to /docs Swagger documentation', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('./docs');
  });

  it('GET /docs loads Swagger UI page', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('Centralized error handler formats 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');
    expect(res.status).toBe(404);
  });
});
