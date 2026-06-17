import { query, initDB } from './db.mjs';
import { getUserFromRequest } from './auth.mjs';

// ─── Helpers ───

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Handlers ───

async function handleCreate(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { project_id, milestone_id, title, description, due_date, mentor_tip } = body;

  if (!project_id) return { status: 400, body: { error: 'project_id is required' } };
  if (!title || !title.trim()) return { status: 400, body: { error: 'title is required' } };

  // Verify project ownership
  const project = await query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
  if (project.length === 0) return { status: 404, body: { error: 'Project not found' } };
  if (user && project[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  // Get next sort order
  const maxRow = await query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM tasks WHERE project_id = $1',
    [project_id]
  );
  const sortOrder = maxRow[0]?.next_order ?? 0;

  const rows = await query(
    `INSERT INTO tasks (project_id, milestone_id, user_id, title, description, due_date, mentor_tip, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, created_at`,
    [project_id, milestone_id || null, user?.id || null, title.trim(), description || '', due_date || null, mentor_tip || '', sortOrder]
  );

  return { status: 201, body: { id: rows[0].id, sort_order: sortOrder, created_at: rows[0].created_at } };
}

async function handleList(req) {
  const user = await getUserFromRequest(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  const milestoneId = url.searchParams.get('milestone_id');
  const status = url.searchParams.get('status');

  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  let sql = 'SELECT * FROM tasks WHERE project_id = $1';
  const params = [projectId];
  let paramIdx = 2;

  if (milestoneId) {
    sql += ` AND milestone_id = $${paramIdx++}`;
    params.push(milestoneId);
  }
  if (status) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  sql += ' ORDER BY sort_order ASC';

  const rows = await query(sql, params);
  return { status: 200, body: { tasks: rows } };
}

async function handleGet(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return { status: 400, body: { error: 'Missing task id' } };

  const rows = await query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (rows.length === 0) return { status: 404, body: { error: 'Task not found' } };

  return { status: 200, body: { task: rows[0] } };
}

async function handleUpdate(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, title, description, due_date, status: taskStatus, milestone_id, mentor_tip, sort_order } = body;

  if (!id) return { status: 400, body: { error: 'id is required' } };

  // Verify ownership
  const existing = await query('SELECT user_id FROM tasks WHERE id = $1', [id]);
  if (existing.length === 0) return { status: 404, body: { error: 'Task not found' } };
  if (user && existing[0].user_id && existing[0].user_id !== user.id) {
    return { status: 403, body: { error: 'Forbidden' } };
  }

  const sets = [];
  const params = [];
  let paramIdx = 1;

  if (title !== undefined) { sets.push(`title = $${paramIdx++}`); params.push(title.trim()); }
  if (description !== undefined) { sets.push(`description = $${paramIdx++}`); params.push(description); }
  if (due_date !== undefined) { sets.push(`due_date = $${paramIdx++}`); params.push(due_date || null); }
  if (taskStatus !== undefined) { sets.push(`status = $${paramIdx++}`); params.push(taskStatus); }
  if (milestone_id !== undefined) { sets.push(`milestone_id = $${paramIdx++}`); params.push(milestone_id || null); }
  if (mentor_tip !== undefined) { sets.push(`mentor_tip = $${paramIdx++}`); params.push(mentor_tip); }
  if (sort_order !== undefined) { sets.push(`sort_order = $${paramIdx++}`); params.push(sort_order); }

  if (sets.length === 0) return { status: 400, body: { error: 'No fields to update' } };

  params.push(id);
  await query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${paramIdx}`, params);

  return { status: 200, body: { updated: true } };
}

async function handleComplete(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, evidence_url, evidence_type } = body;

  if (!id) return { status: 400, body: { error: 'id is required' } };

  const existing = await query('SELECT user_id, status FROM tasks WHERE id = $1', [id]);
  if (existing.length === 0) return { status: 404, body: { error: 'Task not found' } };
  if (user && existing[0].user_id && existing[0].user_id !== user.id) {
    return { status: 403, body: { error: 'Forbidden' } };
  }

  await query(
    `UPDATE tasks SET status = 'completed', completed_at = NOW(), evidence_url = $1, evidence_type = $2 WHERE id = $3`,
    [evidence_url || '', evidence_type || '', id]
  );

  return { status: 200, body: { completed: true, id } };
}

async function handleToday(req) {
  const user = await getUserFromRequest(req);
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };

  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');

  let sql = `
    SELECT t.*, p.title AS project_title
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = $1 AND t.status != 'completed'
  `;
  const params = [user.id];
  let paramIdx = 2;

  if (projectId) {
    sql += ` AND t.project_id = $${paramIdx++}`;
    params.push(projectId);
  }

  sql += ' ORDER BY t.due_date ASC NULLS LAST, t.sort_order ASC';

  const rows = await query(sql, params);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = rows.filter(t => t.due_date && t.due_date < today);
  const dueToday = rows.filter(t => t.due_date === today);
  const upcoming = rows.filter(t => !t.due_date || t.due_date > today);

  return {
    status: 200,
    body: { overdue, due_today: dueToday, upcoming, total: rows.length },
  };
}

// ─── Vercel Handler ───

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action') || '';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors());
    res.end();
    return;
  }

  try {
    await initDB();

    let result;
    if (action === 'create' && req.method === 'POST') {
      result = await handleCreate(req);
    } else if (action === 'list' && req.method === 'GET') {
      result = await handleList(req);
    } else if (action === 'get' && req.method === 'GET') {
      result = await handleGet(req);
    } else if (action === 'update' && req.method === 'POST') {
      result = await handleUpdate(req);
    } else if (action === 'complete' && req.method === 'POST') {
      result = await handleComplete(req);
    } else if (action === 'today' && req.method === 'GET') {
      result = await handleToday(req);
    } else {
      result = { status: 404, body: { error: 'Unknown action' } };
    }

    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  } catch (err) {
    console.error('Tasks error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
