import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/scale.mjs');

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
  return callHandler(`/api/scale?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

// ─── Dashboard ───

describe('GET /api/scale?action=dashboard', () => {
  beforeEach(() => resetMock());

  it('returns scaling dashboard with aggregated stats', async () => {
    setMockResults((sql) => {
      if (sql.includes('scaling_plans')) return [
        { id: 'p-1', target_region: 'East Africa', status: 'planned', budget_estimate: 10000, readiness_score: 40 },
        { id: 'p-2', target_region: 'South Asia', status: 'active', budget_estimate: 20000, readiness_score: 80 },
      ];
      if (sql.includes('partnerships')) return [
        { id: 'pt-1', partner_name: 'UNDP', status: 'active' },
        { id: 'pt-2', partner_name: 'WHO', status: 'prospecting' },
      ];
      return [];
    });

    const res = await callHandler('/api/scale?action=dashboard&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.plans_count).toBe(2);
    expect(res.body.partnerships_count).toBe(2);
    expect(res.body.active_partners).toBe(1);
    expect(res.body.total_budget).toBe(30000);
    expect(res.body.avg_readiness).toBe(60);
    expect(res.body.status_breakdown.planned).toBe(1);
    expect(res.body.status_breakdown.active).toBe(1);
  });

  it('returns empty dashboard for project with no scaling data', async () => {
    setMockResults(() => []);

    const res = await callHandler('/api/scale?action=dashboard&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.plans_count).toBe(0);
    expect(res.body.partnerships_count).toBe(0);
    expect(res.body.active_partners).toBe(0);
    expect(res.body.total_budget).toBe(0);
    expect(res.body.avg_readiness).toBe(0);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/scale?action=dashboard');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/i);
  });
});

// ─── Create Plan ───

describe('POST /api/scale?action=plan', () => {
  beforeEach(() => resetMock());

  it('creates a scaling plan and returns id', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      if (sql.includes('INSERT INTO scaling_plans')) return [{ id: 'sp-1', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('plan', {
      project_id: 'proj-1',
      target_region: 'East Africa',
      target_country: 'KE',
      strategy: 'Partner with local NGOs',
      timeline: '6 months',
      budget_estimate: 15000,
      currency: 'USD',
      notes: 'Phase 1 expansion',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('sp-1');
  });

  it('rejects missing project_id', async () => {
    const res = await postReq('plan', { target_region: 'East Africa' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/i);
  });

  it('rejects missing target_region', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('plan', { project_id: 'proj-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/target_region/i);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await postReq('plan', { project_id: 'nonexistent', target_region: 'Test' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('plan', { project_id: 'proj-1', target_region: 'Hack' });
    expect(res.status).toBe(403);
  });
});

// ─── List Plans ───

describe('GET /api/scale?action=plans', () => {
  beforeEach(() => resetMock());

  it('lists scaling plans for a project', async () => {
    setMockResults(() => [
      { id: 'sp-1', target_region: 'East Africa', status: 'planned' },
      { id: 'sp-2', target_region: 'South Asia', status: 'active' },
    ]);

    const res = await callHandler('/api/scale?action=plans&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(2);
  });

  it('filters by status', async () => {
    setMockResults((sql) => {
      if (sql.includes('AND status')) return [{ id: 'sp-1', target_region: 'East Africa', status: 'active' }];
      return [];
    });

    const res = await callHandler('/api/scale?action=plans&project_id=proj-1&status=active');
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/scale?action=plans');
    expect(res.status).toBe(400);
  });
});

// ─── Update Plan ───

describe('POST /api/scale?action=update-plan', () => {
  beforeEach(() => resetMock());

  it('updates scaling plan fields', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM scaling_plans')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE scaling_plans')) return [];
      return [];
    });

    const res = await postReq('update-plan', {
      id: 'sp-1',
      status: 'active',
      readiness_score: 75,
      budget_estimate: 25000,
    });

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    const queries = getQueries();
    const updateQuery = queries.find(q => q.text.includes('UPDATE scaling_plans'));
    expect(updateQuery.text).toContain('status');
    expect(updateQuery.text).toContain('readiness_score');
    expect(updateQuery.text).toContain('budget_estimate');
  });

  it('rejects missing id', async () => {
    const res = await postReq('update-plan', { status: 'active' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/id/i);
  });

  it('rejects empty update', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM scaling_plans')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('update-plan', { id: 'sp-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no fields/i);
  });

  it('returns 404 for nonexistent plan', async () => {
    setMockResults(() => []);
    const res = await postReq('update-plan', { id: 'nonexistent', status: 'active' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM scaling_plans')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('update-plan', { id: 'sp-1', status: 'active' });
    expect(res.status).toBe(403);
  });
});

// ─── Create Partnership ───

describe('POST /api/scale?action=partnership', () => {
  beforeEach(() => resetMock());

  it('creates a partnership and returns id', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      if (sql.includes('INSERT INTO partnerships')) return [{ id: 'pt-1', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('partnership', {
      project_id: 'proj-1',
      partner_name: 'UNDP Accelerator Lab',
      partner_type: 'ngo',
      description: 'Co-funding for pilot program',
      contact_email: 'partner@undp.org',
      contribution: 'Funding + mentorship',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('pt-1');
  });

  it('rejects missing project_id', async () => {
    const res = await postReq('partnership', { partner_name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/i);
  });

  it('rejects missing partner_name', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('partnership', { project_id: 'proj-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/partner_name/i);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await postReq('partnership', { project_id: 'nonexistent', partner_name: 'Test' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('partnership', { project_id: 'proj-1', partner_name: 'Hack' });
    expect(res.status).toBe(403);
  });
});

// ─── List Partnerships ───

describe('GET /api/scale?action=partnerships', () => {
  beforeEach(() => resetMock());

  it('lists partnerships for a project', async () => {
    setMockResults(() => [
      { id: 'pt-1', partner_name: 'UNDP', status: 'active' },
      { id: 'pt-2', partner_name: 'WHO', status: 'prospecting' },
    ]);

    const res = await callHandler('/api/scale?action=partnerships&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.partnerships).toHaveLength(2);
  });

  it('filters by status', async () => {
    setMockResults((sql) => {
      if (sql.includes('AND status')) return [{ id: 'pt-1', partner_name: 'UNDP', status: 'active' }];
      return [];
    });

    const res = await callHandler('/api/scale?action=partnerships&project_id=proj-1&status=active');
    expect(res.status).toBe(200);
    expect(res.body.partnerships).toHaveLength(1);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/scale?action=partnerships');
    expect(res.status).toBe(400);
  });
});

// ─── Update Partnership ───

describe('POST /api/scale?action=update-partnership', () => {
  beforeEach(() => resetMock());

  it('updates partnership fields', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM partnerships')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE partnerships')) return [];
      return [];
    });

    const res = await postReq('update-partnership', {
      id: 'pt-1',
      status: 'active',
      description: 'MOU signed',
    });

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    const queries = getQueries();
    const updateQuery = queries.find(q => q.text.includes('UPDATE partnerships'));
    expect(updateQuery.text).toContain('status');
    expect(updateQuery.text).toContain('description');
  });

  it('rejects missing id', async () => {
    const res = await postReq('update-partnership', { status: 'active' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/id/i);
  });

  it('rejects empty update', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM partnerships')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('update-partnership', { id: 'pt-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no fields/i);
  });

  it('returns 404 for nonexistent partnership', async () => {
    setMockResults(() => []);
    const res = await postReq('update-partnership', { id: 'nonexistent', status: 'active' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM partnerships')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('update-partnership', { id: 'pt-1', status: 'active' });
    expect(res.status).toBe(403);
  });
});

// ─── Handler routing ───

describe('scale handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/scale?action=nope');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/scale', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
