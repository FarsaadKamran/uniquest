import jwt from 'jsonwebtoken';
import request from 'supertest';
import { buildTestApp, seedUser, testConfig, validStudent } from './helpers/testApp';

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a garbage token', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for an expired token', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validStudent);
    const expired = jwt.sign({ role: 'STUDENT' }, testConfig.jwtSecret, {
      subject: reg.body.user.id,
      expiresIn: -10,
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validStudent);
    const forged = jwt.sign({ role: 'ADMIN' }, 'some-other-secret-some-other-secret-1', {
      subject: reg.body.user.id,
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validStudent);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validStudent.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });
});

describe('GET /api/users (admin only)', () => {
  it('returns 403 for a student', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validStudent);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${reg.body.token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });

  it('lets an admin list registered users without password hashes', async () => {
    const { app, repo } = buildTestApp();
    await seedUser(repo, { email: 'admin@mu.ie', password: 'adminpass123', role: 'ADMIN' });
    await request(app).post('/api/auth/register').send(validStudent);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@mu.ie', password: 'adminpass123' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    for (const u of res.body.users) expect(u).not.toHaveProperty('passwordHash');
  });
});

describe('misc', () => {
  it('GET /health returns ok', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 JSON for unknown routes', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
