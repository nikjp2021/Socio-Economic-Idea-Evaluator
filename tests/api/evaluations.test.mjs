import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';
import jwt from 'jsonwebtoken';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));

const { default: evalHandler } = await import('../../api/evaluations.mjs');

const JWT_SECRET = process.env.JWT_SECRET || 'see-dev-secret-change-in-production';
const HOST = 'localhost:3000';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2026-06-17T00:00:00Z',
};

const TEST_EVAL = {
  id: '00000000-0000-0000-0000-000000000010',
  idea_text: 'Community garden in Nairobi',
  country: 'KE',
  idea_type: 'agriculture',
  score: 7.5,
  verdict: 'GO',
  verdict_label: 'Go — Ready to test',
  sdg_tags: [2, 11],
  created_at: '2026-06-17T00:00:00Z',
};

const TEST_LISTING = {
  id: '00000000-0000-0000-0000-000000000020',
  badge: 'gold',
  badge_label: 'Gold',
  hook: 'Community garden that feeds 200 families',
  idea_type: 'agriculture',
  region: 'Kenya',
  sdg_tags: [2],
  upvotes: 5,
  created_at: '2026-06-17T00:00:00Z',
};

function authHeaders(token) {
  return { host: HOST, authorization: `Bearer ${token}` };
}

function evalReq(action, opts = {}) {
  const method = opts.method || (opts.body ? 'POST' : 'GET');
  return buildReq(`/api/evaluations?action=${action}`, {
    method,
    headers: { host: HOST, ...opts.headers },
    body: opts.body,
  });
}

function callEval(req) {
  const res = buildRes();
  return evalHandler(req, res).then(() => ({
    status: res.statusCode,
    body: JSON.parse(res.body || '{}'),
  }));
}

// ─── Save Evaluation ───

describe('POST /api/evaluations?action=save', () => {
  beforeEach(() => resetMock());

  it('saves evaluation with full result', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('INSERT INTO evaluations')) return [{ id: TEST_EVAL.id, created_at: TEST_EVAL.created_at }];
      if (sql.includes('INSERT INTO mentor_matches')) return [];
      if (sql.includes('INSERT INTO evaluation_analytics')) return [];
      return [];
    });

    const req = evalReq('save', {
      headers: authHeaders(token),
      body: {
        idea_text: 'Community garden in Nairobi',
        result: {
          parsed: { country: 'KE', idea_type: 'agriculture' },
          verdict: { score: 7.5, category: 'GO', label: 'Go — Ready to test' },
          sdg_tags: [2, 11],
          mentor_council: [{ id: 'mentor1', name: 'Test Mentor', match_score: 85, score_tier: 'high_score' }],
        },
      },
    });
    const res = await callEval(req);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(TEST_EVAL.id);
  });

  it('saves evaluation anonymously when no token', async () => {
    setMockResults((sql) => {
      if (sql.includes('INSERT INTO evaluations')) return [{ id: TEST_EVAL.id, created_at: TEST_EVAL.created_at }];
      if (sql.includes('INSERT INTO evaluation_analytics')) return [];
      return [];
    });

    const req = evalReq('save', {
      body: {
        idea_text: 'Community garden in Nairobi',
        result: { parsed: {}, verdict: {}, sdg_tags: [] },
      },
    });
    const res = await callEval(req);

    expect(res.status).toBe(201);
  });

  it('rejects missing idea_text with 400', async () => {
    const req = evalReq('save', {
      body: { result: { parsed: {}, verdict: {} } },
    });
    const res = await callEval(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/idea_text/i);
  });

  it('rejects missing result with 400', async () => {
    const req = evalReq('save', {
      body: { idea_text: 'Some idea' },
    });
    const res = await callEval(req);

    expect(res.status).toBe(400);
  });
});

// ─── List Evaluations ───

describe('GET /api/evaluations?action=list', () => {
  beforeEach(() => resetMock());

  it('returns user evaluations when authenticated', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('SELECT id, idea_text')) return [TEST_EVAL];
      if (sql.includes('COUNT')) return [{ total: '1' }];
      return [];
    });

    const req = evalReq('list', { headers: authHeaders(token) });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.evaluations).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('returns recent public evaluations when anonymous', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, idea_text')) return [TEST_EVAL];
      return [];
    });

    const req = evalReq('list');
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.evaluations).toHaveLength(1);
  });

  it('respects limit and offset params', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, idea_text')) return [];
      return [];
    });

    const req = buildReq(`/api/evaluations?action=list&limit=5&offset=10`, {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
  });
});

// ─── Get Evaluation ───

describe('GET /api/evaluations?action=get', () => {
  beforeEach(() => resetMock());

  it('returns evaluation with mentor matches', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT e.*, u.name')) return [{ ...TEST_EVAL, user_name: 'Test User' }];
      if (sql.includes('SELECT persona_id')) return [{ persona_id: 'mentor1', persona_name: 'Mentor', match_score: 85, playbook_tier: 'high_score', playbook_json: {} }];
      return [];
    });

    const req = buildReq(`/api/evaluations?action=get&id=${TEST_EVAL.id}`, {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.evaluation.id).toBe(TEST_EVAL.id);
    expect(res.body.evaluation.mentor_matches).toHaveLength(1);
  });

  it('returns 404 for nonexistent evaluation', async () => {
    setMockResults(() => []);

    const req = buildReq('/api/evaluations?action=get&id=nonexistent', {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callEval(req);

    expect(res.status).toBe(404);
  });

  it('returns 400 when id is missing', async () => {
    const req = evalReq('get');
    const res = await callEval(req);

    expect(res.status).toBe(400);
  });
});

// ─── Favorites ───

describe('POST /api/evaluations?action=favorite', () => {
  beforeEach(() => resetMock());

  it('adds favorite when not already favorited', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('SELECT id FROM favorites')) return [];
      if (sql.includes('INSERT INTO favorites')) return [];
      return [];
    });

    const req = evalReq('favorite', {
      headers: authHeaders(token),
      body: { evaluation_id: TEST_EVAL.id },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(true);
  });

  it('removes favorite when already favorited (toggle)', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('SELECT id FROM favorites')) return [{ id: 'fav-1' }];
      if (sql.includes('DELETE FROM favorites')) return [];
      return [];
    });

    const req = evalReq('favorite', {
      headers: authHeaders(token),
      body: { evaluation_id: TEST_EVAL.id },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(false);
  });

  it('requires authentication', async () => {
    const req = evalReq('favorite', {
      body: { evaluation_id: TEST_EVAL.id },
    });
    const res = await callEval(req);

    expect(res.status).toBe(401);
  });

  it('requires evaluation_id', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      return [];
    });

    const req = evalReq('favorite', {
      headers: authHeaders(token),
      body: {},
    });
    const res = await callEval(req);

    expect(res.status).toBe(400);
  });
});

// ─── List Favorites ───

describe('GET /api/evaluations?action=favorites', () => {
  beforeEach(() => resetMock());

  it('returns user favorites', async () => {
    const token = signToken(TEST_USER.id);
    setMockResults((sql) => {
      if (sql.includes('SELECT id, email, name, created_at')) return [TEST_USER];
      if (sql.includes('SELECT f.id')) return [{ id: 'fav-1', evaluation_id: TEST_EVAL.id, idea_text: TEST_EVAL.idea_text, score: 7.5 }];
      return [];
    });

    const req = evalReq('favorites', { headers: authHeaders(token) });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.favorites).toHaveLength(1);
  });

  it('requires authentication', async () => {
    const req = evalReq('favorites');
    const res = await callEval(req);

    expect(res.status).toBe(401);
  });
});

// ─── Upvote ───

describe('POST /api/evaluations?action=upvote', () => {
  beforeEach(() => resetMock());

  it('increments upvotes', async () => {
    setMockResults((sql) => {
      if (sql.includes('UPDATE marketplace_listings')) return [{ upvotes: 6 }];
      return [];
    });

    const req = evalReq('upvote', {
      body: { listing_id: TEST_LISTING.id },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.upvotes).toBe(6);
  });

  it('returns 404 for nonexistent listing', async () => {
    setMockResults(() => []);

    const req = evalReq('upvote', {
      body: { listing_id: 'nonexistent' },
    });
    const res = await callEval(req);

    expect(res.status).toBe(404);
  });

  it('requires listing_id', async () => {
    const req = evalReq('upvote', { body: {} });
    const res = await callEval(req);

    expect(res.status).toBe(400);
  });
});

// ─── Marketplace Submit ───

describe('POST /api/evaluations?action=marketplace-submit', () => {
  beforeEach(() => resetMock());

  it('submits listing to marketplace', async () => {
    setMockResults((sql) => {
      if (sql.includes('INSERT INTO marketplace_listings')) return [{ id: TEST_LISTING.id, created_at: TEST_LISTING.created_at }];
      return [];
    });

    const req = evalReq('marketplace-submit', {
      body: {
        hook: 'Community garden that feeds 200 families',
        badge: 'gold',
        idea_type: 'agriculture',
        region: 'Kenya',
        sdg_tags: [2],
      },
    });
    const res = await callEval(req);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(TEST_LISTING.id);
  });

  it('rejects missing hook with 400', async () => {
    const req = evalReq('marketplace-submit', {
      body: { badge: 'gold' },
    });
    const res = await callEval(req);

    expect(res.status).toBe(400);
  });
});

// ─── Marketplace List ───

describe('GET /api/evaluations?action=marketplace', () => {
  beforeEach(() => resetMock());

  it('returns marketplace listings', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, badge')) return [TEST_LISTING];
      return [];
    });

    const req = evalReq('marketplace');
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].hook).toBe(TEST_LISTING.hook);
  });

  it('filters by badge', async () => {
    setMockResults((sql) => {
      if (sql.includes('badge =')) return [TEST_LISTING];
      return [];
    });

    const req = buildReq('/api/evaluations?action=marketplace&badge=gold', {
      method: 'GET',
      headers: { host: HOST },
    });
    const res = await callEval(req);

    expect(res.status).toBe(200);
  });
});

// ─── Edge Cases ───

describe('evaluations edge cases', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const req = evalReq('unknown');
    const res = await callEval(req);

    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/evaluations', {
      method: 'OPTIONS',
      headers: { host: HOST },
    });
    const res = buildRes();
    await evalHandler(req, res);

    expect(res.statusCode).toBe(204);
  });
});
