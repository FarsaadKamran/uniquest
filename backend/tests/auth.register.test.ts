import request from 'supertest';
import { buildTestApp, validStudent } from './helpers/testApp';

describe('POST /api/auth/register', () => {
  it('creates a student and returns a token without leaking the password hash', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'alex.morgan@mumail.ie',
      displayName: 'Alex M.',
      role: 'STUDENT',
      xp: 0,
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('stores a bcrypt hash, never the plaintext password', async () => {
    const { app, repo } = buildTestApp();
    await request(app).post('/api/auth/register').send(validStudent);

    const stored = await repo.findByEmail('alex.morgan@mumail.ie');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.passwordHash).not.toContain(validStudent.password);
  });

  it('normalises the email to lowercase', async () => {
    const { app, repo } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, email: '  Alex.Morgan@MUMAIL.ie ' });

    expect(res.status).toBe(201);
    expect(await repo.findByEmail('alex.morgan@mumail.ie')).not.toBeNull();
  });

  it('rejects a duplicate email with 409', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validStudent);
    const res = await request(app).post('/api/auth/register').send(validStudent);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a student with a non-@mumail.ie email', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, email: 'alex@gmail.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('email');
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('password');
  });

  it('rejects passwords longer than the bcrypt 72-byte limit', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, password: 'a'.repeat(73) });

    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not allow self-registration as ADMIN', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, accountType: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('accountType');
  });

  it('ignores a client-supplied role/xp field', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, role: 'ADMIN', xp: 9999 });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.xp).toBe(0);
  });

  it('lets a lecturer register with a staff email only', async () => {
    const { app } = buildTestApp();
    const base = { ...validStudent, accountType: 'LECTURER' };

    const ok = await request(app).post('/api/auth/register').send({ ...base, email: 'jane.doe@mu.ie' });
    expect(ok.status).toBe(201);
    expect(ok.body.user.role).toBe('LECTURER');

    const bad = await request(app)
      .post('/api/auth/register')
      .send({ ...base, email: 'student@mumail.ie' });
    expect(bad.status).toBe(400);
  });

  it('lets a society committee member register with a student email', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validStudent, accountType: 'COMMITTEE_MEMBER' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('COMMITTEE_MEMBER');
  });

  it('returns 400 for malformed JSON', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
