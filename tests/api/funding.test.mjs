import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/funding.mjs');

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
  return callHandler(`/api/funding?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

// ─── Match ───

describe('GET /api/funding?action=match', () => {
  beforeEach(() => resetMock());

  it('returns matched funding sources sorted by score', async () => {
    setMockResults(() => [
      {
        id: 'fs-1', name: 'Global Grant', type: 'grant',
        countries: ['*'], zones: ['*'], sdg_focus: [], idea_types: [], economic_tiers: [],
        status: 'active',
      },
      {
        id: 'fs-2', name: 'Kenya Only', type: 'csr',
        countries: ['KE'], zones: ['east_africa'], sdg_focus: [1, 2], idea_types: ['health'], economic_tiers: [],
        status: 'active',
      },
    ]);

    const res = await callHandler('/api/funding?action=match&country=KE&sdg_tags=1,2');
    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(2);
    // Kenya-specific should score higher
    expect(res.body.matches[0].match_score).toBeGreaterThanOrEqual(res.body.matches[1].match_score);
  });

  it('filters out zero-score matches', async () => {
    setMockResults(() => [
      {
        id: 'fs-1', name: 'India Only', type: 'grant',
        countries: ['IN'], zones: ['south_asia'], sdg_focus: [4], idea_types: ['education'], economic_tiers: ['low'],
        status: 'active',
      },
    ]);

    const res = await callHandler('/api/funding?action=match&country=KE&zone=east_africa&idea_type=health&economic_tier=high');
    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(0);
  });

  it('includes criteria in response', async () => {
    setMockResults(() => []);

    const res = await callHandler('/api/funding?action=match&country=JP&zone=east_asia&idea_type=health&economic_tier=low');
    expect(res.status).toBe(200);
    expect(res.body.criteria.country).toBe('JP');
    expect(res.body.criteria.zone).toBe('east_asia');
    expect(res.body.criteria.idea_type).toBe('health');
    expect(res.body.criteria.economic_tier).toBe('low');
  });

  it('respects limit parameter', async () => {
    const sources = Array.from({ length: 5 }, (_, i) => ({
      id: `fs-${i}`, name: `Source ${i}`, type: 'grant',
      countries: ['*'], zones: ['*'], sdg_focus: [], idea_types: [], economic_tiers: [],
      status: 'active',
    }));
    setMockResults(() => sources);

    const res = await callHandler('/api/funding?action=match&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(3);
  });
});

// ─── List Sources ───

describe('GET /api/funding?action=list', () => {
  beforeEach(() => resetMock());

  it('lists active funding sources', async () => {
    setMockResults(() => [
      { id: 'fs-1', name: 'NLnet', type: 'grant', status: 'active' },
      { id: 'fs-2', name: 'Kiva', type: 'microfinance', status: 'active' },
    ]);

    const res = await callHandler('/api/funding?action=list');
    expect(res.status).toBe(200);
    expect(res.body.sources).toHaveLength(2);
  });

  it('filters by type', async () => {
    setMockResults((sql) => {
      if (sql.includes("AND type =")) return [{ id: 'fs-1', name: 'Kiva', type: 'microfinance' }];
      return [];
    });

    const res = await callHandler('/api/funding?action=list&type=microfinance');
    expect(res.status).toBe(200);
    expect(res.body.sources).toHaveLength(1);

    const queries = getQueries();
    const listQuery = queries.find(q => q.text.includes('funding_sources') && q.text.includes('type'));
    expect(listQuery.params).toContain('microfinance');
  });

  it('applies limit and offset', async () => {
    setMockResults(() => [{ id: 'fs-1', name: 'Test', type: 'grant' }]);

    const res = await callHandler('/api/funding?action=list&limit=5&offset=10');
    expect(res.status).toBe(200);

    const queries = getQueries();
    const listQuery = queries.find(q => q.text.includes('funding_sources') && q.text.includes('LIMIT'));
    expect(listQuery.params).toContain(5);
    expect(listQuery.params).toContain(10);
  });
});

// ─── Create Application ───

describe('POST /api/funding?action=apply', () => {
  beforeEach(() => resetMock());

  it('creates a funding application', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id FROM funding_sources')) return [{ id: 'fs-1' }];
      if (sql.includes('INSERT INTO funding_applications')) return [{ id: 'app-1', status: 'draft', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('apply', {
      funding_source_id: 'fs-1',
      project_id: 'proj-1',
      notes: 'Applying for seed funding',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('app-1');
    expect(res.body.status).toBe('draft');
  });

  it('rejects missing funding_source_id', async () => {
    const res = await postReq('apply', { project_id: 'proj-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/funding_source_id/i);
  });

  it('returns 404 for nonexistent funding source', async () => {
    setMockResults(() => []);
    const res = await postReq('apply', { funding_source_id: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  it('allows optional project_id and notes', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT id FROM funding_sources')) return [{ id: 'fs-1' }];
      if (sql.includes('INSERT INTO funding_applications')) return [{ id: 'app-2', status: 'draft', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('apply', { funding_source_id: 'fs-1' });
    expect(res.status).toBe(201);
  });
});

// ─── Update Application ───

describe('POST /api/funding?action=update-application', () => {
  beforeEach(() => resetMock());

  it('updates application status', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM funding_applications')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE funding_applications')) return [];
      return [];
    });

    const res = await postReq('update-application', { id: 'app-1', status: 'submitted' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    const queries = getQueries();
    const updateQuery = queries.find(q => q.text.includes('UPDATE funding_applications'));
    expect(updateQuery.text).toContain('status');
    expect(updateQuery.text).toContain('submitted_at');
  });

  it('updates notes only', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM funding_applications')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE funding_applications')) return [];
      return [];
    });

    const res = await postReq('update-application', { id: 'app-1', notes: 'Updated notes' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);
  });

  it('rejects missing id', async () => {
    const res = await postReq('update-application', { status: 'submitted' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/id/i);
  });

  it('rejects empty update', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM funding_applications')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('update-application', { id: 'app-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nothing/i);
  });

  it('returns 404 for nonexistent application', async () => {
    setMockResults(() => []);
    const res = await postReq('update-application', { id: 'nonexistent', status: 'submitted' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM funding_applications')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('update-application', { id: 'app-1', status: 'submitted' });
    expect(res.status).toBe(403);
  });
});

// ─── List Applications ───

describe('GET /api/funding?action=applications', () => {
  beforeEach(() => resetMock());

  it('lists user applications with joined data', async () => {
    setMockResults(() => [
      {
        id: 'app-1', status: 'draft', notes: '', submitted_at: null, created_at: '2026-06-17T00:00:00Z',
        source_name: 'NLnet', source_type: 'grant', source_url: 'https://nlnet.nl',
        min_amount: 5000, max_amount: 50000, currency: 'EUR',
        project_title: 'My Project',
      },
    ]);

    const res = await callHandler('/api/funding?action=applications');
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].source_name).toBe('NLnet');
    expect(res.body.applications[0].project_title).toBe('My Project');
  });

  it('returns empty list for user with no applications', async () => {
    setMockResults(() => []);

    const res = await callHandler('/api/funding?action=applications');
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(0);
  });
});

// ─── Seed ───

describe('POST /api/funding?action=seed', () => {
  beforeEach(() => resetMock());

  it('rejects invalid seed key', async () => {
    const res = await callHandler('/api/funding?action=seed&key=wrong-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('seeds funding sources with valid key', async () => {
    setMockResults(() => []);

    const res = await callHandler('/api/funding?action=seed&key=see-seed-2024', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(200);
    expect(res.body.seeded).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
  });
});

// ─── Handler routing ───

describe('funding handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/funding?action=nope');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/funding', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
