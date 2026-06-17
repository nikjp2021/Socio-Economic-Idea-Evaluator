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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Handlers ───

async function handleLog(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { project_id, metric_name, metric_value, metric_unit, source, notes, recorded_at } = body;

  if (!project_id) return { status: 400, body: { error: 'project_id is required' } };
  if (!metric_name || !metric_name.trim()) return { status: 400, body: { error: 'metric_name is required' } };
  if (metric_value === undefined || metric_value === null) return { status: 400, body: { error: 'metric_value is required' } };

  // Verify project ownership
  const project = await query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
  if (project.length === 0) return { status: 404, body: { error: 'Project not found' } };
  if (user && project[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  const rows = await query(
    `INSERT INTO impact_metrics (project_id, user_id, metric_name, metric_value, metric_unit, source, notes, recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, created_at`,
    [
      project_id,
      user?.id || null,
      metric_name.trim(),
      parseFloat(metric_value),
      metric_unit || '',
      source || 'self-reported',
      notes || '',
      recorded_at || new Date().toISOString(),
    ]
  );

  return { status: 201, body: { id: rows[0].id, created_at: rows[0].created_at } };
}

async function handleList(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  const metricName = url.searchParams.get('metric_name');

  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  let sql = 'SELECT * FROM impact_metrics WHERE project_id = $1';
  const params = [projectId];
  let paramIdx = 2;

  if (metricName) {
    sql += ` AND metric_name = $${paramIdx++}`;
    params.push(metricName);
  }

  sql += ' ORDER BY recorded_at DESC';

  const rows = await query(sql, params);
  return { status: 200, body: { metrics: rows } };
}

async function handleGet(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return { status: 400, body: { error: 'Missing metric id' } };

  const rows = await query('SELECT * FROM impact_metrics WHERE id = $1', [id]);
  if (rows.length === 0) return { status: 404, body: { error: 'Metric not found' } };

  return { status: 200, body: { metric: rows[0] } };
}

async function handleDashboard(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  // Get all distinct metric names for this project
  const names = await query(
    'SELECT DISTINCT metric_name FROM impact_metrics WHERE project_id = $1',
    [projectId]
  );

  // For each metric name, get latest value, total entries, and trend data
  const metricNames = names.map(n => n.metric_name);
  const summaries = [];

  for (const name of metricNames) {
    const latest = await query(
      `SELECT metric_value, metric_unit, source, recorded_at
       FROM impact_metrics WHERE project_id = $1 AND metric_name = $2
       ORDER BY recorded_at DESC LIMIT 1`,
      [projectId, name]
    );

    const history = await query(
      `SELECT metric_value, recorded_at
       FROM impact_metrics WHERE project_id = $1 AND metric_name = $2
       ORDER BY recorded_at ASC`,
      [projectId, name]
    );

    const total = await query(
      'SELECT COUNT(*) AS count FROM impact_metrics WHERE project_id = $1 AND metric_name = $2',
      [projectId, name]
    );

    summaries.push({
      metric_name: name,
      latest_value: latest[0]?.metric_value ?? 0,
      unit: latest[0]?.metric_unit ?? '',
      source: latest[0]?.source ?? '',
      latest_recorded_at: latest[0]?.recorded_at ?? null,
      total_entries: parseInt(total[0]?.count ?? '0', 10),
      history: history.map(h => ({ value: h.metric_value, recorded_at: h.recorded_at })),
    });
  }

  // Compute progress deltas (latest vs previous for each metric)
  for (const s of summaries) {
    if (s.history.length >= 2) {
      const latest = parseFloat(s.history[s.history.length - 1].value);
      const previous = parseFloat(s.history[s.history.length - 2].value);
      s.delta = Math.round((latest - previous) * 100) / 100;
      s.delta_pct = previous !== 0 ? Math.round(((latest - previous) / Math.abs(previous)) * 10000) / 100 : null;
    } else {
      s.delta = 0;
      s.delta_pct = null;
    }
  }

  return {
    status: 200,
    body: {
      project_id: projectId,
      metric_count: metricNames.length,
      metrics: summaries,
    },
  };
}

async function handleDelete(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const id = body.id || new URL(req.url, `http://${req.headers.host}`).searchParams.get('id');
  if (!id) return { status: 400, body: { error: 'id is required' } };

  const existing = await query('SELECT user_id FROM impact_metrics WHERE id = $1', [id]);
  if (existing.length === 0) return { status: 404, body: { error: 'Metric not found' } };
  if (user && existing[0].user_id && existing[0].user_id !== user.id) {
    return { status: 403, body: { error: 'Forbidden' } };
  }

  await query('DELETE FROM impact_metrics WHERE id = $1', [id]);
  return { status: 200, body: { deleted: true } };
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
    if (action === 'log' && req.method === 'POST') {
      result = await handleLog(req);
    } else if (action === 'list' && req.method === 'GET') {
      result = await handleList(req);
    } else if (action === 'get' && req.method === 'GET') {
      result = await handleGet(req);
    } else if (action === 'dashboard' && req.method === 'GET') {
      result = await handleDashboard(req);
    } else if (action === 'delete' && req.method === 'POST') {
      result = await handleDelete(req);
    } else {
      result = { status: 404, body: { error: 'Unknown action' } };
    }

    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  } catch (err) {
    console.error('Track error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
