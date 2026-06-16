import { query, initDB } from './db.mjs';
import { getUserFromRequest, verifyToken } from './auth.mjs';

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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function extractToken(req) {
  const auth = req.headers?.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ─── Handlers ───

async function handleListEvaluations(req) {
  const user = await getUserFromRequest(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  if (user) {
    const rows = await query(
      `SELECT id, idea_text, country, idea_type, economic_tier, score, verdict,
              verdict_label, sdg_tags, created_at
       FROM evaluations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );
    const count = await query(
      'SELECT COUNT(*) as total FROM evaluations WHERE user_id = $1',
      [user.id]
    );
    return json({ evaluations: rows, total: parseInt(count[0].total, 10) });
  }

  // Anonymous: return recent public evaluations
  const rows = await query(
    `SELECT id, idea_text, country, idea_type, score, verdict,
            verdict_label, sdg_tags, created_at
     FROM evaluations
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return json({ evaluations: rows, total: rows.length });
}

async function handleGetEvaluation(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing evaluation id' }, 400);

  const rows = await query(
    `SELECT e.*, u.name as user_name
     FROM evaluations e
     LEFT JOIN users u ON e.user_id = u.id
     WHERE e.id = $1`,
    [id]
  );

  if (rows.length === 0) return json({ error: 'Evaluation not found' }, 404);

  // Get mentor matches for this evaluation
  const mentors = await query(
    `SELECT persona_id, persona_name, match_score, playbook_tier, playbook_json
     FROM mentor_matches
     WHERE evaluation_id = $1
     ORDER BY match_score DESC`,
    [id]
  );

  const evaluation = rows[0];
  evaluation.mentor_matches = mentors;

  return json({ evaluation });
}

async function handleSaveEvaluation(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { idea_text, result } = body;

  if (!idea_text || !result) {
    return json({ error: 'idea_text and result are required' }, 400);
  }

  const parsed = result.parsed || {};
  const verdict = result.verdict || {};
  const sdgTags = result.sdg_tags || [];

  const rows = await query(
    `INSERT INTO evaluations
       (user_id, idea_text, country, idea_type, economic_tier, score, verdict, verdict_label, sdg_tags, result_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, created_at`,
    [
      user?.id || null,
      idea_text,
      parsed.country || result.country || null,
      parsed.idea_type || result.idea_type || null,
      parsed.economic_tier || verdict.economic_tier || null,
      verdict.score || result.score || null,
      verdict.category || result.verdict || null,
      verdict.label || result.verdict_label || null,
      JSON.stringify(sdgTags),
      JSON.stringify(result),
    ]
  );

  const evaluationId = rows[0].id;

  // Save mentor matches
  const mentors = result.mentor_council || [];
  for (const m of mentors) {
    await query(
      `INSERT INTO mentor_matches
         (evaluation_id, persona_id, persona_name, match_score, playbook_tier, playbook_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        evaluationId,
        m.id || '',
        m.name || '',
        m.match_score || m.score || 0,
        m.playbook_tier || m.score_tier || 'mid_score',
        JSON.stringify(m),
      ]
    ).catch(() => {});
  }

  // Track analytics
  await query(
    `INSERT INTO evaluation_analytics (user_id, event_type, metadata)
     VALUES ($1, 'evaluation_submit', $2)`,
    [user?.id || null, JSON.stringify({ country: parsed.country, type: parsed.idea_type })]
  ).catch(() => {});

  return json({ id: evaluationId, created_at: rows[0].created_at }, 201);
}

async function handleToggleFavorite(req) {
  const user = await getUserFromRequest(req);
  if (!user) return json({ error: 'Login required' }, 401);

  const body = await readBody(req);
  const { evaluation_id, fav_type, title, notes } = body;

  if (!evaluation_id) return json({ error: 'evaluation_id is required' }, 400);

  // Check if already favorited
  const existing = await query(
    'SELECT id FROM favorites WHERE user_id = $1 AND evaluation_id = $2 AND fav_type = $3',
    [user.id, evaluation_id, fav_type || 'evaluation']
  );

  if (existing.length > 0) {
    await query('DELETE FROM favorites WHERE id = $1', [existing[0].id]);
    return json({ favorited: false });
  }

  await query(
    `INSERT INTO favorites (user_id, evaluation_id, fav_type, title, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, evaluation_id, fav_type || 'evaluation', title || '', notes || '']
  );

  return json({ favorited: true });
}

async function handleListFavorites(req) {
  const user = await getUserFromRequest(req);
  if (!user) return json({ error: 'Login required' }, 401);

  const rows = await query(
    `SELECT f.id, f.evaluation_id, f.fav_type, f.title, f.notes, f.created_at,
            e.idea_text, e.score, e.verdict, e.verdict_label, e.country
     FROM favorites f
     LEFT JOIN evaluations e ON f.evaluation_id = e.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [user.id]
  );

  return json({ favorites: rows });
}

async function handleSubmitToMarketplace(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { evaluation_id, hook, badge, badge_label, idea_type, region, sdg_tags } = body;

  if (!hook) return json({ error: 'Hook text is required' }, 400);

  const rows = await query(
    `INSERT INTO marketplace_listings
       (evaluation_id, user_id, badge, badge_label, hook, idea_type, region, sdg_tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, created_at`,
    [
      evaluation_id || null,
      user?.id || null,
      badge || 'developing',
      badge_label || 'Developing',
      hook,
      idea_type || 'Social Impact',
      region || '',
      JSON.stringify(sdg_tags || []),
    ]
  );

  return json({ id: rows[0].id }, 201);
}

async function handleListMarketplace(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const badge = url.searchParams.get('badge');

  let sql = `SELECT id, badge, badge_label, hook, idea_type, region, sdg_tags, upvotes, created_at
             FROM marketplace_listings WHERE status = 'approved'`;
  const params = [];

  if (badge && badge !== 'all') {
    params.push(badge);
    sql += ` AND badge = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const rows = await query(sql, params);
  return json({ listings: rows });
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
    if (action === 'list' && req.method === 'GET') {
      result = await handleListEvaluations(req);
    } else if (action === 'get' && req.method === 'GET') {
      result = await handleGetEvaluation(req);
    } else if (action === 'save' && req.method === 'POST') {
      result = await handleSaveEvaluation(req);
    } else if (action === 'favorite' && req.method === 'POST') {
      result = await handleToggleFavorite(req);
    } else if (action === 'favorites' && req.method === 'GET') {
      result = await handleListFavorites(req);
    } else if (action === 'marketplace-submit' && req.method === 'POST') {
      result = await handleSubmitToMarketplace(req);
    } else if (action === 'marketplace' && req.method === 'GET') {
      result = await handleListMarketplace(req);
    } else {
      result = json({ error: 'Unknown action' }, 404);
    }

    const body = await result.text();
    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    console.error('Evaluations error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
