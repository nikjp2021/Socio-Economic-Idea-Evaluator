import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq, buildRes } from './_helpers/req.mjs';
import { resetMock, setMockResults, getQueries } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));
vi.mock('../../api/auth.mjs', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' }),
}));

const { default: handler } = await import('../../api/tasks.mjs');

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
  return callHandler(`/api/tasks?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

// ─── Create ───

describe('POST /api/tasks?action=create', () => {
  beforeEach(() => resetMock());

  it('creates a task and returns id', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      if (sql.includes('COALESCE(MAX(sort_order)')) return [{ next_order: 0 }];
      if (sql.includes('INSERT INTO tasks')) return [{ id: 'task-1', created_at: '2026-06-17T00:00:00Z' }];
      return [];
    });

    const res = await postReq('create', {
      project_id: 'proj-1',
      title: 'Research target audience',
      description: 'Conduct surveys',
      due_date: '2026-07-01',
      mentor_tip: 'Start small',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('task-1');
    expect(res.body.sort_order).toBe(0);
  });

  it('rejects missing project_id', async () => {
    const res = await postReq('create', { title: 'No project' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/i);
  });

  it('rejects missing title', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'user-1' }];
      return [];
    });

    const res = await postReq('create', { project_id: 'proj-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 404 for nonexistent project', async () => {
    setMockResults(() => []);
    const res = await postReq('create', { project_id: 'nonexistent', title: 'Test' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM projects')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('create', { project_id: 'proj-1', title: 'Hack' });
    expect(res.status).toBe(403);
  });
});

// ─── List ───

describe('GET /api/tasks?action=list', () => {
  beforeEach(() => resetMock());

  it('lists tasks for a project', async () => {
    setMockResults(() => [
      { id: 'task-1', title: 'Task A', status: 'pending', sort_order: 0 },
      { id: 'task-2', title: 'Task B', status: 'completed', sort_order: 1 },
    ]);

    const res = await callHandler('/api/tasks?action=list&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
  });

  it('filters by milestone_id', async () => {
    setMockResults((sql) => {
      if (sql.includes('AND milestone_id')) return [{ id: 'task-1', title: 'Milestone task', status: 'pending' }];
      return [];
    });

    const res = await callHandler('/api/tasks?action=list&project_id=proj-1&milestone_id=m-1');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
  });

  it('filters by status', async () => {
    setMockResults((sql) => {
      if (sql.includes('AND status')) return [{ id: 'task-1', title: 'Done task', status: 'completed' }];
      return [];
    });

    const res = await callHandler('/api/tasks?action=list&project_id=proj-1&status=completed');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
  });

  it('rejects missing project_id', async () => {
    const res = await callHandler('/api/tasks?action=list');
    expect(res.status).toBe(400);
  });
});

// ─── Get ───

describe('GET /api/tasks?action=get', () => {
  beforeEach(() => resetMock());

  it('returns a task by id', async () => {
    setMockResults(() => [{ id: 'task-1', title: 'My Task', status: 'pending' }]);

    const res = await callHandler('/api/tasks?action=get&id=task-1');
    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe('My Task');
  });

  it('returns 404 for nonexistent task', async () => {
    setMockResults(() => []);
    const res = await callHandler('/api/tasks?action=get&id=nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing id', async () => {
    const res = await callHandler('/api/tasks?action=get');
    expect(res.status).toBe(400);
  });
});

// ─── Update ───

describe('POST /api/tasks?action=update', () => {
  beforeEach(() => resetMock());

  it('updates task fields', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM tasks')) return [{ user_id: 'user-1' }];
      if (sql.includes('UPDATE tasks')) return [];
      return [];
    });

    const res = await postReq('update', { id: 'task-1', title: 'Updated Task', status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    const queries = getQueries();
    const updateQuery = queries.find(q => q.text.includes('UPDATE tasks'));
    expect(updateQuery.text).toContain('title');
    expect(updateQuery.text).toContain('status');
  });

  it('rejects missing id', async () => {
    const res = await postReq('update', { title: 'No ID' });
    expect(res.status).toBe(400);
  });

  it('rejects empty update', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM tasks')) return [{ user_id: 'user-1' }];
      return [];
    });
    const res = await postReq('update', { id: 'task-1' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for wrong owner', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id FROM tasks')) return [{ user_id: 'other-user' }];
      return [];
    });

    const res = await postReq('update', { id: 'task-1', title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for nonexistent task', async () => {
    setMockResults(() => []);
    const res = await postReq('update', { id: 'nonexistent', title: 'X' });
    expect(res.status).toBe(404);
  });
});

// ─── Complete ───

describe('POST /api/tasks?action=complete', () => {
  beforeEach(() => resetMock());

  it('marks task as completed with evidence', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id, status FROM tasks')) return [{ user_id: 'user-1', status: 'pending' }];
      if (sql.includes('UPDATE tasks SET status')) return [];
      return [];
    });

    const res = await postReq('complete', {
      id: 'task-1',
      evidence_url: 'https://example.com/proof.jpg',
      evidence_type: 'image',
    });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);

    const queries = getQueries();
    const completeQuery = queries.find(q => q.text.includes("status = 'completed'"));
    expect(completeQuery.params).toContain('https://example.com/proof.jpg');
    expect(completeQuery.params).toContain('image');
  });

  it('marks task as completed without evidence', async () => {
    setMockResults((sql) => {
      if (sql.includes('SELECT user_id, status FROM tasks')) return [{ user_id: 'user-1', status: 'pending' }];
      if (sql.includes('UPDATE tasks SET status')) return [];
      return [];
    });

    const res = await postReq('complete', { id: 'task-1' });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('rejects missing id', async () => {
    const res = await postReq('complete', {});
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent task', async () => {
    setMockResults(() => []);
    const res = await postReq('complete', { id: 'nonexistent' });
    expect(res.status).toBe(404);
  });
});

// ─── Today ───

describe('GET /api/tasks?action=today', () => {
  beforeEach(() => resetMock());

  it('returns tasks grouped by overdue/today/upcoming', async () => {
    setMockResults((sql) => {
      if (sql.includes('JOIN projects')) return [
        { id: 'task-1', title: 'Overdue', status: 'pending', due_date: '2026-01-01', project_title: 'P1' },
        { id: 'task-2', title: 'Future', status: 'pending', due_date: '2099-12-31', project_title: 'P1' },
        { id: 'task-3', title: 'No date', status: 'pending', due_date: null, project_title: 'P2' },
      ];
      return [];
    });

    const res = await callHandler('/api/tasks?action=today');
    expect(res.status).toBe(200);
    expect(res.body.overdue).toBeDefined();
    expect(res.body.due_today).toBeDefined();
    expect(res.body.upcoming).toBeDefined();
    expect(res.body.total).toBe(3);
  });

  it('filters by project_id', async () => {
    setMockResults((sql) => {
      if (sql.includes('JOIN projects')) return [
        { id: 'task-1', title: 'Filtered', status: 'pending', due_date: null, project_title: 'P1' },
      ];
      return [];
    });

    const res = await callHandler('/api/tasks?action=today&project_id=proj-1');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

// ─── Handler routing ───

describe('tasks handler routing', () => {
  beforeEach(() => resetMock());

  it('returns 404 for unknown action', async () => {
    const res = await callHandler('/api/tasks?action=nope');
    expect(res.status).toBe(404);
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/tasks', { method: 'OPTIONS', headers: { host: HOST } });
    const res = buildRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });
});
