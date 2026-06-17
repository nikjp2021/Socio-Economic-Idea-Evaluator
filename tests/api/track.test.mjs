import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/track.mjs');

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
  return callHandler(`/api/track?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

// ─── Log ───

describe('POST /api/track?action=log', () => {
  beforeEach(() => resetMock());

  it('logs a metric and returns id', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      if (sql.includes('INSERT INTO impact_metrics')) return [{ id: 'm-1', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('log', {
      project_id: 'proj-1',
      metric_name: 'beneficiaries_reached',
      metric_value: 150,
      metric_unit: 'people',
      source: 'self-reported',
      notes: 'First batch',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('m-1');

    const queries = getQueries();
    const insertQuery = queries.find(q => q.text.includes('INSERT INTO impact_metrics'));
    expect(insertQuery.params).toContain('beneficiaries_reached');
    expect(insertQuery.params).toContain(150);
  });

  it('rejects missing project_id', async () => {
    const res = await postReq('log', { metric_name: 'test', metric_value: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/i);
  });

  it('rejects missing metric_name', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('log', { project_id: 'proj-1', metric_value: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/metric_name/i);
  });

  it('rejects missing metric_value', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('log', { project_id: 'proj-1', metric_name: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/metric_value/i);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await postReq('log', { project_id: 'nonexistent', metric_name: 'test', metric_value: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('log', { project_id: 'proj-1', metric_name: 'test', metric_value: 1 });
    expect(res.status).toBe(403);
  });
});

// ─── List ───

describe('GET /api/track?action=list', () => {
  beforeEach(() => resetMock());

  it('lists metrics for a project', async () => {
    setMockResults(() => [
      { id: 'm-1', metric_name: 'beneficiaries', metric_value: 100, recorded_at: '2026-06-01T00:00:00Z' },
      { id: 'm-2', metric_name: 'beneficiaries', metric_value: 150, recorded_at: '2026-06-15T00:00:00Z' },
    ]);

    const res = await callHandler('/api/track?action=list&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(2);
  });

  it('filters by metric_name', async () => {
    setMockResults((sql) => {
      if (sql.includes('AND metric_name')) return [{ id: 'm-1', metric_name: 'revenue', metric_value: 500 }];
      return [];
    });

    const res = await callHandler('/api/track?action=list&project_id=proj-1&metric_name=revenue');
    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(1);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/track?action=list');
    expect(res.status).toBe(400);
  });
});

// ─── Get ───

describe('GET /api/track?action=get', () => {
  beforeEach(() => resetMock());

  it('returns a metric by id', async () => {
    setMockResults(() => [{ id: 'm-1', metric_name: 'beneficiaries', metric_value: 100 }]);

    const res = await callHandler('/api/track?action=get&id=m-1');
    expect(res.status).toBe(200);
    expect(res.body.metric.metric_name).toBe('beneficiaries');
  });

  it('returns 404 for nonexistent metric', async () => {
    setMockResults(() => []);
    const res = await callHandler('/api/track?action=get&id=nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing id', async () => {
    const res = await callHandler('/api/track?action=get');
    expect(res.status).toBe(400);
  });
});

// ─── Dashboard ───

describe('GET /api/track?action=dashboard', () => {
  beforeEach(() => resetMock());

  it('returns aggregated dashboard data', async () => {
    let callCount = 0;
    setMockResults((sql) => {
      callCount++;
      if (sql.includes('DISTINCT metric_name')) return [{ metric_name: 'beneficiaries' }];
      if (sql.includes('ORDER BY recorded_at DESC LIMIT 1')) return [{ metric_value: 200, metric_unit: 'people', source: 'self-reported', recorded_at: '2026-06-15T00:00:00Z' }];
      if (sql.includes('ORDER BY recorded_at ASC')) return [
        { metric_value: 100, recorded_at: '2026-06-01T00:00:00Z' },
        { metric_value: 150, recorded_at: '2026-06-08T00:00:00Z' },
        { metric_value: 200, recorded_at: '2026-06-15T00:00:00Z' },
      ];
      if (sql.includes('COUNT(*)')) return [{ count: '3' }];
      return [];
    });

    const res = await callHandler('/api/track?action=dashboard&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.project_id).toBe('proj-1');
    expect(res.body.metric_count).toBe(1);
    expect(res.body.metrics).toHaveLength(1);
    expect(res.body.metrics[0].metric_name).toBe('beneficiaries');
    expect(res.body.metrics[0].latest_value).toBe(200);
    expect(res.body.metrics[0].total_entries).toBe(3);
    expect(res.body.metrics[0].history).toHaveLength(3);
    expect(res.body.metrics[0].delta).toBe(50);
    expect(res.body.metrics[0].delta_pct).toBe(33.33);
  });

  it('returns empty metrics for project with no data', async () => {
    setMockResults(() => []);

    const res = await callHandler('/api/track?action=dashboard&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.metric_count).toBe(0);
    expect(res.body.metrics).toHaveLength(0);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/track?action=dashboard');
    expect(res.status).toBe(400);
  });

  it('computes delta_pct as null when previous value is zero', async () => {
    setMockResults((sql) => {
      if (sql.includes('DISTINCT metric_name')) return [{ metric_name: 'new_metric' }];
      if (sql.includes('ORDER BY recorded_at DESC LIMIT 1')) return [{ metric_value: 10, metric_unit: '', source: 'survey', recorded_at: '2026-06-10T00:00:00Z' }];
      if (sql.includes('ORDER BY recorded_at ASC')) return [
        { metric_value: 0, recorded_at: '2026-06-01T00:00:00Z' },
        { metric_value: 10, recorded_at: '2026-06-10T00:00:00Z' },
      ];
      if (sql.includes('COUNT(*)')) return [{ count: '2' }];
      return [];
    });

    const res = await callHandler('/api/track?action=dashboard&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.metrics[0].delta).toBe(10);
    expect(res.body.metrics[0].delta_pct).toBeNull();
  });
});

// ─── Delete ───

describe('POST /api/track?action=delete', () => {
  beforeEach(() => resetMock());

  it('deletes a metric', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM impact_metrics')) return [{ user_id: 'user-1' }];
      if (sql.includes('DELETE FROM impact_metrics')) return [];
      return [];
    });

    const res = await postReq('delete', { id: 'm-1' });
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM impact_metrics')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('delete', { id: 'm-1' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for nonexistent metric', async () => {
    setMockResults(() => []);
    const res = await postReq('delete', { id: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  it('rejects missing id', async () => {
    const res = await postReq('delete', {});
    expect(res.status).toBe(400);
  });
});

// ─── Handler routing ───

describe('track handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/track?action=nope');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/track', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
