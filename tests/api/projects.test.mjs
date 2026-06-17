import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/projects.mjs');

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
  return callHandler(`/api/projects?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

// ─── Create ───

describe('POST /api/projects?action=create', () => {
  beforeEach(() => resetMock());

  it('creates a project and returns id', async () => {
    setMockResults((sql) => {
      if (sql.includes('INSERT INTO projects')) return [{ id: 'proj-1', created_at: '2026-06-17T00:00:00Z' }];
      if (sql.includes('INSERT INTO milestones')) return [];
      return [];
    });

    const res = await postReq('create', {
      title: 'My Community Garden',
      description: 'A test project',
      case_study_id: 'cs-1',
      case_study_title: 'Rooftop Gardens of Havana',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('proj-1');
  });

  it('auto-creates milestones from roadmap', async () => {
    const queries = [];
    setMockResults((sql, params) => {
      queries.push(sql);
      if (sql.includes('INSERT INTO projects')) return [{ id: 'proj-2', created_at: '2026-06-17T00:00:00Z' }];
      if (sql.includes('INSERT INTO milestones')) return [];
      return [];
    });

    const res = await postReq('create', {
      title: 'Test Project',
      roadmap: {
        milestones: [
          { phase: 'research', label: 'Research', description: 'Do research' },
          { phase: 'action', label: 'Build prototype', description: '' },
          { phase: 'action', label: 'Launch MVP', description: 'Go live' },
        ],
      },
    });

    expect(res.status).toBe(201);
    // 3 milestone INSERTs
    const milestoneInserts = queries.filter(q => q.includes('INSERT INTO milestones'));
    expect(milestoneInserts.length).toBe(3);
  });

  it('rejects missing title', async () => {
    const res = await postReq('create', { description: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });
});

// ─── List ───

describe('GET /api/projects?action=list', () => {
  beforeEach(() => resetMock());

  it('lists projects for authenticated user', async () => {
    setMockResults(() => [
      { id: 'proj-1', title: 'Project A', status: 'active', progress_pct: 30 },
      { id: 'proj-2', title: 'Project B', status: 'active', progress_pct: 60 },
    ]);

    const res = await callHandler('/api/projects?action=list');
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(2);
  });

  it('filters by status', async () => {
    setMockResults((sql) => {
      if (sql.includes("AND status = $2")) return [{ id: 'proj-1', title: 'Done', status: 'completed' }];
      return [];
    });

    const res = await callHandler('/api/projects?action=list&status=completed');
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
  });
});

// ─── Get ───

describe('GET /api/projects?action=get', () => {
  beforeEach(() => resetMock());

  it('returns project with milestones and check-ins', async () => {
    let callCount = 0;
    setMockResults((sql) => {
      callCount++;
      if (sql.includes('SELECT * FROM projects WHERE id')) return [{ id: 'proj-1', title: 'Test', status: 'active', progress_pct: 50 }];
      if (sql.includes('SELECT * FROM milestones')) return [
        { id: 'm-1', phase: 'action', label: 'Step 1', status: 'completed' },
        { id: 'm-2', phase: 'action', label: 'Step 2', status: 'pending' },
      ];
      if (sql.includes('SELECT * FROM check_ins')) return [
        { id: 'ci-1', week_number: 1, mood: 'good' },
      ];
      return [];
    });

    const res = await callHandler('/api/projects?action=get&id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.project.milestones).toHaveLength(2);
    expect(res.body.project.check_ins).toHaveLength(1);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await callHandler('/api/projects?action=get&id=nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing id', async () => {
    const res = await callHandler('/api/projects?action=get');
    expect(res.status).toBe(400);
  });
});

// ─── Update ───

describe('POST /api/projects?action=update', () => {
  beforeEach(() => resetMock());

  it('updates project fields', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE projects')) return [];
      return [];
    });

    const res = await postReq('update', { id: 'proj-1', title: 'Updated Title', is_public: true });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    const queries = getQueries();
    const updateQuery = queries.find(q => q.text.includes('UPDATE projects'));
    expect(updateQuery.text).toContain('title');
    expect(updateQuery.text).toContain('is_public');
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('update', { id: 'proj-1', title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('rejects missing id', async () => {
    const res = await postReq('update', { title: 'No ID' });
    expect(res.status).toBe(400);
  });

  it('rejects empty update', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });
    const res = await postReq('update', { id: 'proj-1' });
    expect(res.status).toBe(400);
  });
});

// ─── Complete Milestone ───

describe('POST /api/projects?action=complete-milestone', () => {
  beforeEach(() => resetMock());

  it('marks milestone as completed and recalculates progress', async () => {
    setMockResults((sql) => {
      if (sql.includes('UPDATE milestones')) return [];
      if (sql.includes('SELECT project_id FROM milestones')) return [{ project_id: 'proj-1' }];
      if (sql.includes('COUNT(CASE WHEN')) return [{ total: '4', done: '1' }];
      if (sql.includes('UPDATE projects SET progress_pct')) return [];
      return [];
    });

    const res = await postReq('complete-milestone', { milestone_id: 'm-1' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');

    // Should update project progress to 25% (1/4)
    const queries = getQueries();
    const progressUpdate = queries.find(q => q.text.includes('progress_pct'));
    expect(progressUpdate.params[0]).toBe(25);
  });

  it('rejects missing milestone_id', async () => {
    const res = await postReq('complete-milestone', {});
    expect(res.status).toBe(400);
  });
});

// ─── Check-in ───

describe('POST /api/projects?action=checkin', () => {
  beforeEach(() => resetMock());

  it('creates a check-in and updates streak', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT created_at FROM projects')) return [{ created_at: '2026-06-01T00:00:00Z' }];
      if (sql.includes('INSERT INTO check_ins')) return [{ id: 'ci-1', created_at: '2026-06-17T00:00:00Z' }];
      if (sql.includes('UPDATE projects SET last_checkin')) return [];
      return [];
    });

    const res = await postReq('checkin', {
      project_id: 'proj-1',
      accomplishments: 'Built the prototype',
      blockers: 'Need more funding',
      next_steps: 'Apply for grants',
      mood: 'optimistic',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('ci-1');
    expect(res.body.week_number).toBeGreaterThan(0);
  });

  it('rejects missing project_id', async () => {
    const res = await postReq('checkin', { accomplishments: 'stuff' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await postReq('checkin', { project_id: 'nonexistent' });
    expect(res.status).toBe(404);
  });
});

// ─── Public Feed ───

describe('GET /api/projects?action=feed', () => {
  beforeEach(() => resetMock());

  it('returns public projects feed', async () => {
    setMockResults(() => [
      { id: 'proj-1', title: 'Public Project', progress_pct: 50, streak_weeks: 3, user_name: 'Alice' },
    ]);

    const res = await callHandler('/api/projects?action=feed');
    expect(res.status).toBe(200);
    expect(res.body.feed).toHaveLength(1);
    expect(res.body.feed[0].user_name).toBe('Alice');
  });
});

// ─── Stats ───

describe('GET /api/projects?action=stats', () => {
  beforeEach(() => resetMock());

  it('returns project statistics', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT * FROM projects WHERE id')) return [{ id: 'proj-1', status: 'active', progress_pct: 50, streak_weeks: 3, created_at: '2026-06-01T00:00:00Z' }];
      if (sql.includes('COUNT(CASE WHEN')) return [{ total: '6', completed: '3' }];
      if (sql.includes('COUNT(*) as total FROM check_ins')) return [{ total: '4' }];
      if (sql.includes('SELECT created_at FROM check_ins')) return [{ created_at: '2026-06-15T00:00:00Z' }];
      return [];
    });

    const res = await callHandler('/api/projects?action=stats&id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.stats.progress_pct).toBe(50);
    expect(res.body.stats.milestones_total).toBe(6);
    expect(res.body.stats.milestones_completed).toBe(3);
    expect(res.body.stats.checkins_total).toBe(4);
  });

  it('returns 400 for missing id', async () => {
    const res = await callHandler('/api/projects?action=stats');
    expect(res.status).toBe(400);
  });
});

// ─── Handler routing ───

describe('projects handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/projects?action=nope');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/projects', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
