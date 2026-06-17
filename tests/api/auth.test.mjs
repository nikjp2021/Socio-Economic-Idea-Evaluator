import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';
import jwt from 'jsonwebtoken';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));

const { default: authHandler, verifyToken, getUserFromRequest } = await import('../../api/auth.mjs');

// Use the same JWT_SECRET the module reads from env (or its dev fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'see-dev-secret-change-in-production';
const HOST = 'localhost:3000';

function authReq(action, opts = {}) {
  const method = opts.method || (action === 'me' ? 'GET' : 'POST');
  return buildReq(`/api/auth?action=${action}`, {
    method,
    headers: { host: HOST, ...opts.headers },
    body: opts.body,
  });
}

function callAuth(req) {
  const res = buildRes();
  return authHandler(req, res).then(() => ({
    status: res.statusCode,
    headers: res.headers,
    body: JSON.parse(res.body || '{}'),
  }));
}

const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  name: 'Test User',
  password_hash: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12', // placeholder
  created_at: '2026-06-17T00:00:00Z',
};

function signTestToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// ─── verifyToken ───

describe('verifyToken', () => {
  it('returns payload for a valid token', () => {
    const token = signTestToken('user-123');
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('returns null for a tampered token', () => {
    const token = signTestToken('user-123') + 'x';
    expect(verifyToken(token)).toBeNull();
  });

  it('returns null for an expired token', () => {
    const token = jwt.sign({ sub: 'user-123' }, JWT_SECRET, { expiresIn: '-1s' });
    expect(verifyToken(token)).toBeNull();
  });

  it('returns null for a token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 'user-123' }, 'wrong-secret');
    expect(verifyToken(token)).toBeNull();
  });
});

// ─── getUserFromRequest ───

describe('getUserFromRequest', () => {
  beforeEach(() => resetMock());

  it('returns user for valid Bearer token', async () => {
    const token = signTestToken(TEST_USER.id);
    setMockResults(() => [TEST_USER]);
    const req = buildReq('/api/auth', {
      headers: { authorization: `Bearer ${token}`, host: HOST },
    });
    const user = await getUserFromRequest(req);
    expect(user).toBeTruthy();
    expect(user.id).toBe(TEST_USER.id);
  });

  it('returns null when no Authorization header', async () => {
    const req = buildReq('/api/auth', { headers: { host: HOST } });
    const user = await getUserFromRequest(req);
    expect(user).toBeNull();
  });

  it('returns null for invalid token', async () => {
    const req = buildReq('/api/auth', {
      headers: { authorization: 'Bearer invalid-token', host: HOST },
    });
    const user = await getUserFromRequest(req);
    expect(user).toBeNull();
  });
});

// ─── Register ───

describe('POST /api/auth?action=register', () => {
  beforeEach(() => resetMock());

  it('registers a new user and returns token', async () => {
    const mockDb = [];
    setMockResults((sql) => {
      mockDb.push(sql);
      // First query: check existing (empty = no duplicate)
      if (sql.includes('SELECT id FROM users WHERE email')) return [];
      // Second query: INSERT user
      if (sql.includes('INSERT INTO users')) return [{ id: TEST_USER.id, email: 'new@example.com', name: 'New User', created_at: TEST_USER.created_at }];
      // Third query: INSERT profile
      if (sql.includes('INSERT INTO user_profiles')) return [];
      // Analytics insert
      if (sql.includes('INSERT INTO evaluation_analytics')) return [];
      return [];
    });

    const req = authReq('register', { body: { email: 'new@example.com', password: 'password123', name: 'New User' } });
    const res = await callAuth(req);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.user.name).toBe('New User');
  });

  it('rejects duplicate email with 409', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id FROM users WHERE email')) return [{ id: 'existing-id' }];
      return [];
    });

    const req = authReq('register', { body: { email: 'existing@example.com', password: 'password123', name: 'Dup User' } });
    const res = await callAuth(req);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects invalid email with 400', async () => {
    const req = authReq('register', { body: { email: 'not-an-email', password: 'password123', name: 'Test' } });
    const res = await callAuth(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects short password with 400', async () => {
    const req = authReq('register', { body: { email: 'test@example.com', password: 'short', name: 'Test' } });
    const res = await callAuth(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it('rejects missing name with 400', async () => {
    const req = authReq('register', { body: { email: 'test@example.com', password: 'password123' } });
    const res = await callAuth(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('rejects short name with 400', async () => {
    const req = authReq('register', { body: { email: 'test@example.com', password: 'password123', name: 'A' } });
    const res = await callAuth(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });
});

// ─── Login ───

describe('POST /api/auth?action=login', () => {
  beforeEach(() => resetMock());

  it('returns token for valid credentials', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correctpassword', 4);

    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, password_hash')) {
        return [{ ...TEST_USER, password_hash: hash }];
      }
      return [];
    });

    const req = authReq('login', { body: { email: TEST_USER.email, password: 'correctpassword' } });
    const res = await callAuth(req);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('rejects wrong password with 401', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correctpassword', 4);

    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, password_hash')) {
        return [{ ...TEST_USER, password_hash: hash }];
      }
      return [];
    });

    const req = authReq('login', { body: { email: TEST_USER.email, password: 'wrongpassword' } });
    const res = await callAuth(req);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects nonexistent email with 401', async () => {
    setMockResults(() => []);

    const req = authReq('login', { body: { email: 'nobody@example.com', password: 'password123' } });
    const res = await callAuth(req);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects missing fields with 400', async () => {
    const req = authReq('login', { body: { email: 'test@example.com' } });
    const res = await callAuth(req);

    expect(res.status).toBe(400);
  });
});

// ─── Me ───

describe('GET /api/auth?action=me', () => {
  beforeEach(() => resetMock());

  it('returns user data for authenticated request', async () => {
    const token = signTestToken(TEST_USER.id);
    let callCount = 0;
    setMockResults((sql) => {
      callCount++;
      // First call: getUserFromRequest → SELECT user
      if (callCount === 1) return [TEST_USER];
      // Second call: SELECT profile
      if (sql.includes('user_profiles')) return [{ role: 'Researcher', organization: 'Test Org', country: 'Japan', bio: '', goals: '', avatar_url: '' }];
      // Third call: SELECT stats
      if (sql.includes('COUNT')) return [{ total_evaluations: '5', gold_count: '2', last_evaluation: '2026-06-17' }];
      return [];
    });

    const req = buildReq('/api/auth?action=me', {
      method: 'GET',
      headers: { host: HOST, authorization: `Bearer ${token}` },
    });
    const res = await callAuth(req);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.profile.role).toBe('Researcher');
    expect(res.body.stats.total_evaluations).toBe('5');
  });

  it('returns 401 for unauthenticated request', async () => {
    const req = buildReq('/api/auth?action=me', {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callAuth(req);

    expect(res.status).toBe(401);
  });
});

// ─── Profile Update ───

describe('POST /api/auth?action=profile', () => {
  beforeEach(() => resetMock());

  it('updates profile for authenticated user', async () => {
    const token = signTestToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('UPDATE users')) return [];
      if (sql.includes('INSERT INTO user_profiles')) return [];
      return [];
    });

    const req = buildReq('/api/auth?action=profile', {
      method: 'POST',
      headers: { host: HOST, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: { name: 'Updated Name', role: 'Founder', organization: 'New Org' },
    });
    const res = await callAuth(req);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 401 for unauthenticated request', async () => {
    const req = buildReq('/api/auth?action=profile', {
      method: 'POST',
      headers: { host: HOST },
      body: { name: 'Hacker' },
    });
    const res = await callAuth(req);

    expect(res.status).toBe(401);
  });
});

// ─── Edge Cases ───

describe('auth edge cases', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const req = buildReq('/api/auth?action=unknown', {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callAuth(req);

    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/auth', {
      method: 'OPTIONS',
      headers: { host: HOST },
    });
    const res = buildRes();
    await authHandler(req, res);

    expect(res.statusCode).toBe(204);
  });
});
