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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Handlers ───

async function handleCreateProject(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { title, description, case_study_id, case_study_title, evaluation_id, intake, roadmap } = body;

  if (!title) return json({ error: 'title is required' }, 400);

  const rows = await query(
    `INSERT INTO projects
       (user_id, evaluation_id, title, description, case_study_id, case_study_title, intake, roadmap)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, created_at`,
    [
      user?.id || null,
      evaluation_id || null,
      title,
      description || '',
      case_study_id || null,
      case_study_title || null,
      JSON.stringify(intake || {}),
      JSON.stringify(roadmap || {}),
    ]
  );

  const projectId = rows[0].id;

  // Auto-create milestones from roadmap if provided
  const milestones = roadmap?.milestones || [];
  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    await query(
      `INSERT INTO milestones (project_id, phase, label, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, m.phase || 'action', m.label || '', m.description || '', i]
    ).catch(() => {});
  }

  return json({ id: projectId, created_at: rows[0].created_at }, 201);
}

async function handleListProjects(req) {
  const user = await getUserFromRequest(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const status = url.searchParams.get('status');

  if (user) {
    let sql = `SELECT id, title, description, case_study_title, status, progress_pct,
                      streak_weeks, last_checkin, is_public, created_at, updated_at
               FROM projects WHERE user_id = $1`;
    const params = [user.id];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await query(sql, params);
    return json({ projects: rows });
  }

  // Anonymous: return public projects
  let sql = `SELECT id, title, description, case_study_title, status, progress_pct,
                    streak_weeks, created_at
             FROM projects WHERE is_public = true`;
  const params = [];

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  sql += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const rows = await query(sql, params);
  return json({ projects: rows });
}

async function handleGetProject(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing project id' }, 400);

  const rows = await query(
    `SELECT * FROM projects WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) return json({ error: 'Project not found' }, 404);

  const project = rows[0];

  // Get milestones
  const milestones = await query(
    `SELECT * FROM milestones WHERE project_id = $1 ORDER BY sort_order`,
    [id]
  );
  project.milestones = milestones;

  // Get recent check-ins
  const checkIns = await query(
    `SELECT * FROM check_ins WHERE project_id = $1 ORDER BY week_number DESC LIMIT 10`,
    [id]
  );
  project.check_ins = checkIns;

  return json({ project });
}

async function handleUpdateProject(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, title, description, status, is_public } = body;

  if (!id) return json({ error: 'id is required' }, 400);

  // Verify ownership
  const existing = await query('SELECT user_id FROM projects WHERE id = $1', [id]);
  if (existing.length === 0) return json({ error: 'Project not found' }, 404);
  if (user && existing[0].user_id !== user.id) return json({ error: 'Not authorized' }, 403);

  const sets = [];
  const params = [];
  let idx = 1;

  if (title !== undefined) { sets.push(`title = $${idx++}`); params.push(title); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description); }
  if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status); }
  if (is_public !== undefined) { sets.push(`is_public = $${idx++}`); params.push(is_public); }

  if (sets.length === 0) return json({ error: 'Nothing to update' }, 400);

  sets.push(`updated_at = NOW()`);
  params.push(id);

  await query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  );

  return json({ updated: true });
}

async function handleCompleteMilestone(req) {
  const body = await readBody(req);
  const { milestone_id, status: newStatus } = body;

  if (!milestone_id) return json({ error: 'milestone_id is required' }, 400);

  const statusVal = newStatus || 'completed';
  const completedAt = statusVal === 'completed' ? new Date().toISOString() : null;

  await query(
    `UPDATE milestones SET status = $1, completed_at = $2 WHERE id = $3`,
    [statusVal, completedAt, milestone_id]
  );

  // Recalculate project progress
  const milestone = await query('SELECT project_id FROM milestones WHERE id = $1', [milestone_id]);
  if (milestone.length > 0) {
    const stats = await query(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'completed' THEN 1 END) as done
       FROM milestones WHERE project_id = $1`,
      [milestone[0].project_id]
    );
    const total = parseInt(stats[0].total, 10);
    const done = parseInt(stats[0].done, 10);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    await query(
      `UPDATE projects SET progress_pct = $1, updated_at = NOW() WHERE id = $2`,
      [pct, milestone[0].project_id]
    );
  }

  return json({ status: statusVal, milestone_id });
}

async function handleCheckIn(req) {
  const body = await readBody(req);
  const { project_id, accomplishments, blockers, next_steps, mood } = body;

  if (!project_id) return json({ error: 'project_id is required' }, 400);

  // Get current week number
  const project = await query('SELECT created_at FROM projects WHERE id = $1', [project_id]);
  if (project.length === 0) return json({ error: 'Project not found' }, 404);

  const created = new Date(project[0].created_at);
  const now = new Date();
  const weekNumber = Math.max(1, Math.ceil((now - created) / (7 * 24 * 60 * 60 * 1000)));

  const rows = await query(
    `INSERT INTO check_ins (project_id, week_number, accomplishments, blockers, next_steps, mood)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [project_id, weekNumber, accomplishments || '', blockers || '', next_steps || '', mood || 'ok']
  );

  // Update streak and last_checkin
  await query(
    `UPDATE projects SET last_checkin = NOW(), streak_weeks = streak_weeks + 1, updated_at = NOW()
     WHERE id = $1`,
    [project_id]
  );

  return json({ id: rows[0].id, week_number: weekNumber, created_at: rows[0].created_at }, 201);
}

async function handlePublicFeed(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);

  const rows = await query(
    `SELECT p.id, p.title, p.description, p.case_study_title, p.progress_pct,
            p.streak_weeks, p.created_at,
            u.name as user_name
     FROM projects p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.is_public = true AND p.status = 'active'
     ORDER BY p.updated_at DESC
     LIMIT $1`,
    [limit]
  );

  return json({ feed: rows });
}

async function handleProjectStats(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing project id' }, 400);

  const project = await query('SELECT * FROM projects WHERE id = $1', [id]);
  if (project.length === 0) return json({ error: 'Project not found' }, 404);

  const milestoneStats = await query(
    `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
     FROM milestones WHERE project_id = $1`,
    [id]
  );

  const checkInCount = await query(
    'SELECT COUNT(*) as total FROM check_ins WHERE project_id = $1',
    [id]
  );

  const lastCheckIn = await query(
    'SELECT created_at FROM check_ins WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
    [id]
  );

  return json({
    stats: {
      progress_pct: project[0].progress_pct,
      streak_weeks: project[0].streak_weeks,
      milestones_total: parseInt(milestoneStats[0].total, 10),
      milestones_completed: parseInt(milestoneStats[0].completed, 10),
      checkins_total: parseInt(checkInCount[0].total, 10),
      last_checkin: lastCheckIn[0]?.created_at || null,
      status: project[0].status,
      days_since_start: Math.ceil((Date.now() - new Date(project[0].created_at)) / (24 * 60 * 60 * 1000)),
    },
  });
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
      result = await handleCreateProject(req);
    } else if (action === 'list' && req.method === 'GET') {
      result = await handleListProjects(req);
    } else if (action === 'get' && req.method === 'GET') {
      result = await handleGetProject(req);
    } else if (action === 'update' && req.method === 'POST') {
      result = await handleUpdateProject(req);
    } else if (action === 'complete-milestone' && req.method === 'POST') {
      result = await handleCompleteMilestone(req);
    } else if (action === 'checkin' && req.method === 'POST') {
      result = await handleCheckIn(req);
    } else if (action === 'feed' && req.method === 'GET') {
      result = await handlePublicFeed(req);
    } else if (action === 'stats' && req.method === 'GET') {
      result = await handleProjectStats(req);
    } else {
      result = json({ error: 'Unknown action' }, 404);
    }

    const body = await result.text();
    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    console.error('Projects error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
