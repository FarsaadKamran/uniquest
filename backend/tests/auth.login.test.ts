import jwt from 'jsonwebtoken';
import request from 'supertest';
import { buildTestApp, testConfig, validStudent } from './helpers/testApp';

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns a valid JWT', async () => {
    const { app } = buildTestApp();
    const reg = await request(app).post('/api/auth/register').send(validStudent);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: validStudent.password });

    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, testConfig.jwtSecret) as jwt.JwtPayload;
    expect(payload.sub).toBe(reg.body.user.id);
    expect(payload.role).toBe('STUDENT');
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('is case-insensitive on email', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validStudent);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ALEX.MORGAN@mumail.ie', password: validStudent.password });

    expect(res.status).toBe(200);
  });

  it('returns 401 for a wrong password', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validStudent);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the same 401 for an unknown email (no user enumeration)', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validStudent);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: validStudent.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@mumail.ie', password: 'whatever123' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
  });

  it('returns 400 when the body is incomplete', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/auth/login').send({ email: validStudent.email });

    expect(res.status).toBe(400);
  });
});
