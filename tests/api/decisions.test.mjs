import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/decisions.mjs');

const HOST = 'localhost:3000';

function callHandler(url, opts = {}) {
  const req = buildReq(url, { headers: { host: HOST, ...opts.headers }, ...opts });
  const res = buildRes();
  return handler(req, res).then(() => ({
    status: res.statusCode,
    body: JSON.parse(res.body || '{}'),
  }));
}

function postReq(action, body, headers = {}) {
  return callHandler(`/api/decisions?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

const EVAL_A = {
  id: 'eval-aaa',
  result: {
    overall_assessment: {
      title: 'Water Purification System',
      overall_score: 7.5,
      scores: {
        feasibility: 8,
        impact_potential: 9,
        resource_requirements: 5,
        sustainability: 7,
        scalability: 6,
        market_fit: 7,
      },
    },
  },
};

const EVAL_B = {
  id: 'eval-bbb',
  result: {
    overall_assessment: {
      title: 'Solar Microgrid',
      overall_score: 6.8,
      scores: {
        feasibility: 5,
        impact_potential: 7,
        resource_requirements: 8,
        sustainability: 6,
        scalability: 8,
        market_fit: 5,
      },
    },
  },
};

const EVAL_C = {
  id: 'eval-ccc',
  result: {
    overall_assessment: {
      title: 'Community Garden',
      overall_score: 5.2,
      scores: {
        feasibility: 9,
        impact_potential: 4,
        resource_requirements: 9,
        sustainability: 5,
        scalability: 3,
        market_fit: 4,
      },
    },
  },
};

// ─── Compare ───

describe('POST /api/decisions?action=compare', () => {
  beforeEach(() => resetMock());

  it('compares two ideas and returns ranked results', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, result FROM evaluations')) return [EVAL_A, EVAL_B];
      if (sql.includes('INSERT INTO decision_sessions')) return [{ id: 'session-1', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('compare', { idea_ids: ['eval-aaa', 'eval-bbb'] });

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBe('session-1');
    expect(res.body.ranked).toHaveLength(2);
    expect(res.body.ranked[0].idea_id).toBe('eval-aaa'); // Higher weighted total
    expect(res.body.ranked[0].weighted_total).toBeGreaterThan(res.body.ranked[1].weighted_total);
    expect(res.body.weights).toBeTruthy();
  });

  it('includes tradeoffs when scores differ enough', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, result FROM evaluations')) return [EVAL_A, EVAL_B];
      if (sql.includes('INSERT INTO decision_sessions')) return [{ id: 'session-2', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('compare', { idea_ids: ['eval-aaa', 'eval-bbb'] });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.tradeoffs)).toBe(true);
    // resource_requirements: A=5, B=8 — diff=3 ≥ 2, should appear
    const rrTradeoff = res.body.tradeoffs.find(t => t.criteria === 'resource_requirements');
    expect(rrTradeoff).toBeTruthy();
    expect(rrTradeoff.advantage).toBe('Solar Microgrid');
  });

  it('compares three ideas', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, result FROM evaluations')) return [EVAL_A, EVAL_B, EVAL_C];
      if (sql.includes('INSERT INTO decision_sessions')) return [{ id: 'session-3', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('compare', { idea_ids: ['eval-aaa', 'eval-bbb', 'eval-ccc'] });

    expect(res.status).toBe(201);
    expect(res.body.ranked).toHaveLength(3);
    // Ranking: A > B > C
    expect(res.body.ranked[0].idea_id).toBe('eval-aaa');
    expect(res.body.ranked[2].idea_id).toBe('eval-ccc');
  });

  it('applies custom weights', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id, result FROM evaluations')) return [EVAL_A, EVAL_B];
      if (sql.includes('INSERT INTO decision_sessions')) return [{ id: 'session-4', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    // Heavily weight resource_requirements (B=8, A=5)
    const res = await postReq('compare', {
      idea_ids: ['eval-aaa', 'eval-bbb'],
      weights: { feasibility: 5, impact_potential: 5, resource_requirements: 80, sustainability: 5, scalability: 3, market_fit: 2 },
    });

    expect(res.status).toBe(201);
    // With heavy resource weight, B should win
    expect(res.body.ranked[0].idea_id).toBe('eval-bbb');
  });

  it('rejects fewer than 2 ideas', async () => {
    const res = await postReq('compare', { idea_ids: ['eval-aaa'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 2/i);
  });

  it('rejects missing idea_ids', async () => {
    const res = await postReq('compare', {});
    expect(res.status).toBe(400);
  });

  it('rejects more than 6 ideas', async () => {
    const res = await postReq('compare', { idea_ids: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    expect(res.status).toBe(400);
  });

  it('returns 404 when no evaluations found', async () => {
    setMockResults(() => []);
    const res = await postReq('compare', { idea_ids: ['nonexistent-1', 'nonexistent-2'] });
    expect(res.status).toBe(404);
  });
});

// ─── Session ───

describe('GET /api/decisions?action=session', () => {
  beforeEach(() => resetMock());

  it('retrieves an existing session', async () => {
    setMockResults(() => [{
      id: 'session-1',
      user_id: 'user-1',
      idea_ids: ['eval-aaa', 'eval-bbb'],
      criteria_weights: { feasibility: 20 },
      comparison_result: { ranked: [], tradeoffs: [] },
      winner_id: null,
      rationale: '',
      created_at: '2026-06-17T00:00:00Z',
    }]);

    const res = await callHandler('/api/decisions?action=session&id=session-1');
    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe('session-1');
    expect(res.body.session.idea_ids).toEqual(['eval-aaa', 'eval-bbb']);
  });

  it('returns 404 for missing session', async () => {
    setMockResults(() => []);
    const res = await callHandler('/api/decisions?action=session&id=nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing id param', async () => {
    const res = await callHandler('/api/decisions?action=session');
    expect(res.status).toBe(400);
  });
});

// ─── Decide ───

describe('POST /api/decisions?action=decide', () => {
  beforeEach(() => resetMock());

  it('records winner and rationale', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id FROM decision_sessions')) return [{ id: 'session-1' }];
      if (sql.includes('UPDATE decision_sessions')) return [];
      return [];
    });

    const res = await postReq('decide', {
      session_id: 'session-1',
      winner_id: 'eval-aaa',
      rationale: 'Better overall feasibility and impact score',
    });

    expect(res.status).toBe(200);
    expect(res.body.decided).toBe(true);
    expect(res.body.winner_id).toBe('eval-aaa');
  });

  it('returns 404 for nonexistent session', async () => {
    setMockResults(() => []);
    const res = await postReq('decide', { session_id: 'nonexistent', winner_id: 'eval-aaa' });
    expect(res.status).toBe(404);
  });

  it('rejects missing session_id', async () => {
    const res = await postReq('decide', { winner_id: 'eval-aaa' });
    expect(res.status).toBe(400);
  });

  it('rejects missing winner_id', async () => {
    const res = await postReq('decide', { session_id: 'session-1' });
    expect(res.status).toBe(400);
  });
});

// ─── Handler routing ───

describe('decisions handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/decisions?action=unknown');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/decisions', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
