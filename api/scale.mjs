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

async function handleDashboard(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  const plans = await query(
    'SELECT * FROM scaling_plans WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );

  const partnerships = await query(
    'SELECT * FROM partnerships WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );

  const activePartners = partnerships.filter(p => p.status === 'active').length;
  const totalBudget = plans.reduce((sum, p) => sum + (p.budget_estimate || 0), 0);
  const avgReadiness = plans.length > 0
    ? Math.round(plans.reduce((sum, p) => sum + (p.readiness_score || 0), 0) / plans.length)
    : 0;

  const statusBreakdown = {};
  for (const p of plans) {
    statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
  }

  return {
    status: 200,
    body: {
      project_id: projectId,
      plans_count: plans.length,
      partnerships_count: partnerships.length,
      active_partners: activePartners,
      total_budget: totalBudget,
      avg_readiness: avgReadiness,
      status_breakdown: statusBreakdown,
      plans,
      partnerships,
    },
  };
}

async function handleCreatePlan(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { project_id, target_region, target_country, strategy, timeline, budget_estimate, currency, notes } = body;

  if (!project_id) return { status: 400, body: { error: 'project_id is required' } };
  if (!target_region || !target_region.trim()) return { status: 400, body: { error: 'target_region is required' } };

  // Verify project ownership
  const project = await query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
  if (project.length === 0) return { status: 404, body: { error: 'Project not found' } };
  if (user && project[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  const rows = await query(
    `INSERT INTO scaling_plans (project_id, user_id, target_region, target_country, strategy, timeline, budget_estimate, currency, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, created_at`,
    [
      project_id, user?.id || null, target_region.trim(), target_country || null,
      strategy || '', timeline || '', budget_estimate || 0, currency || 'USD', notes || '',
    ]
  );

  return { status: 201, body: { id: rows[0].id, created_at: rows[0].created_at } };
}

async function handleListPlans(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  const status = url.searchParams.get('status');

  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  let sql = 'SELECT * FROM scaling_plans WHERE project_id = $1';
  const params = [projectId];
  let idx = 2;

  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await query(sql, params);
  return { status: 200, body: { plans: rows } };
}

async function handleUpdatePlan(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, target_region, target_country, strategy, timeline, budget_estimate, currency, status: planStatus, readiness_score, notes } = body;

  if (!id) return { status: 400, body: { error: 'id is required' } };

  const existing = await query('SELECT user_id FROM scaling_plans WHERE id = $1', [id]);
  if (existing.length === 0) return { status: 404, body: { error: 'Plan not found' } };
  if (user && existing[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  const sets = [];
  const params = [];
  let idx = 1;

  if (target_region !== undefined) { sets.push(`target_region = $${idx++}`); params.push(target_region.trim()); }
  if (target_country !== undefined) { sets.push(`target_country = $${idx++}`); params.push(target_country || null); }
  if (strategy !== undefined) { sets.push(`strategy = $${idx++}`); params.push(strategy); }
  if (timeline !== undefined) { sets.push(`timeline = $${idx++}`); params.push(timeline); }
  if (budget_estimate !== undefined) { sets.push(`budget_estimate = $${idx++}`); params.push(budget_estimate); }
  if (currency !== undefined) { sets.push(`currency = $${idx++}`); params.push(currency); }
  if (planStatus !== undefined) { sets.push(`status = $${idx++}`); params.push(planStatus); }
  if (readiness_score !== undefined) { sets.push(`readiness_score = $${idx++}`); params.push(readiness_score); }
  if (notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(notes); }

  if (sets.length === 0) return { status: 400, body: { error: 'No fields to update' } };

  sets.push(`updated_at = NOW()`);
  params.push(id);

  await query(`UPDATE scaling_plans SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  return { status: 200, body: { updated: true } };
}

async function handleCreatePartnership(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { project_id, partner_name, partner_type, description, contact_email, contribution } = body;

  if (!project_id) return { status: 400, body: { error: 'project_id is required' } };
  if (!partner_name || !partner_name.trim()) return { status: 400, body: { error: 'partner_name is required' } };

  // Verify project ownership
  const project = await query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
  if (project.length === 0) return { status: 404, body: { error: 'Project not found' } };
  if (user && project[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  const rows = await query(
    `INSERT INTO partnerships (project_id, user_id, partner_name, partner_type, description, contact_email, contribution)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [
      project_id, user?.id || null, partner_name.trim(), partner_type || '',
      description || '', contact_email || '', contribution || '',
    ]
  );

  return { status: 201, body: { id: rows[0].id, created_at: rows[0].created_at } };
}

async function handleListPartnerships(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const projectId = url.searchParams.get('project_id');
  const status = url.searchParams.get('status');

  if (!projectId) return { status: 400, body: { error: 'project_id is required' } };

  let sql = 'SELECT * FROM partnerships WHERE project_id = $1';
  const params = [projectId];
  let idx = 2;

  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await query(sql, params);
  return { status: 200, body: { partnerships: rows } };
}

async function handleUpdatePartnership(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, partner_name, partner_type, description, contact_email, status: partnerStatus, contribution } = body;

  if (!id) return { status: 400, body: { error: 'id is required' } };

  const existing = await query('SELECT user_id FROM partnerships WHERE id = $1', [id]);
  if (existing.length === 0) return { status: 404, body: { error: 'Partnership not found' } };
  if (user && existing[0].user_id !== user.id) return { status: 403, body: { error: 'Forbidden' } };

  const sets = [];
  const params = [];
  let idx = 1;

  if (partner_name !== undefined) { sets.push(`partner_name = $${idx++}`); params.push(partner_name.trim()); }
  if (partner_type !== undefined) { sets.push(`partner_type = $${idx++}`); params.push(partner_type); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description); }
  if (contact_email !== undefined) { sets.push(`contact_email = $${idx++}`); params.push(contact_email); }
  if (partnerStatus !== undefined) { sets.push(`status = $${idx++}`); params.push(partnerStatus); }
  if (contribution !== undefined) { sets.push(`contribution = $${idx++}`); params.push(contribution); }

  if (sets.length === 0) return { status: 400, body: { error: 'No fields to update' } };

  sets.push(`updated_at = NOW()`);
  params.push(id);

  await query(`UPDATE partnerships SET ${sets.join(', ')} WHERE id = $${idx}`, params);
  return { status: 200, body: { updated: true } };
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
    if (action === 'dashboard' && req.method === 'GET') {
      result = await handleDashboard(req);
    } else if (action === 'plan' && req.method === 'POST') {
      result = await handleCreatePlan(req);
    } else if (action === 'plans' && req.method === 'GET') {
      result = await handleListPlans(req);
    } else if (action === 'update-plan' && req.method === 'POST') {
      result = await handleUpdatePlan(req);
    } else if (action === 'partnership' && req.method === 'POST') {
      result = await handleCreatePartnership(req);
    } else if (action === 'partnerships' && req.method === 'GET') {
      result = await handleListPartnerships(req);
    } else if (action === 'update-partnership' && req.method === 'POST') {
      result = await handleUpdatePartnership(req);
    } else {
      result = { status: 404, body: { error: 'Unknown action' } };
    }

    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  } catch (err) {
    console.error('Scale error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
