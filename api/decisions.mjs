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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Scoring ───

const DEFAULT_WEIGHTS = {
  feasibility: 20,
  impact_potential: 20,
  resource_requirements: 15,
  sustainability: 15,
  scalability: 15,
  market_fit: 15,
};

const SCORE_FIELDS = [
  'feasibility', 'impact_potential', 'resource_requirements',
  'sustainability', 'scalability', 'market_fit',
];

function extractScores(evaluation) {
  const result = {};
  const data = evaluation?.result || evaluation || {};

  // Try nested structured result first
  const scores = data.overall_assessment?.scores || data.scores || {};
  for (const field of SCORE_FIELDS) {
    result[field] = scores[field] ?? 5;
  }

  // Overall score
  result.overall = data.overall_assessment?.overall_score ?? data.overall_score ?? 5;

  return result;
}

function weightedScore(scores, weights) {
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] !== undefined) {
      total += scores[key] * weight;
      weightSum += weight;
    }
  }
  return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
}

function generateTradeoffs(evaluations, scores) {
  if (evaluations.length < 2) return [];

  const tradeoffs = [];
  const pairs = [];

  for (let i = 0; i < evaluations.length; i++) {
    for (let j = i + 1; j < evaluations.length; j++) {
      pairs.push([i, j]);
    }
  }

  for (const [i, j] of pairs) {
    const a = scores[i];
    const b = scores[j];
    const nameA = evaluations[i]?.title || `Idea ${i + 1}`;
    const nameB = evaluations[j]?.title || `Idea ${j + 1}`;

    for (const field of SCORE_FIELDS) {
      const diff = (a[field] || 0) - (b[field] || 0);
      if (Math.abs(diff) >= 2) {
        tradeoffs.push({
          criteria: field,
          advantage: diff > 0 ? nameA : nameB,
          disadvantage: diff > 0 ? nameB : nameA,
          difference: Math.abs(diff),
          insight: `${diff > 0 ? nameA : nameB} scores ${Math.abs(diff)} points higher on ${field.replace(/_/g, ' ')} than ${diff > 0 ? nameB : nameA}.`,
        });
      }
    }
  }

  return tradeoffs.sort((a, b) => b.difference - a.difference).slice(0, 10);
}

// ─── Handlers ───

async function handleCompare(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { idea_ids, weights } = body;

  if (!idea_ids || !Array.isArray(idea_ids) || idea_ids.length < 2) {
    return json({ error: 'At least 2 idea_ids required' }, 400);
  }
  if (idea_ids.length > 6) {
    return json({ error: 'Maximum 6 ideas per comparison' }, 400);
  }

  const mergedWeights = { ...DEFAULT_WEIGHTS, ...(weights || {}) };

  // Fetch evaluations
  const placeholders = idea_ids.map((_, i) => `$${i + 1}`).join(', ');
  const rows = await query(
    `SELECT id, result FROM evaluations WHERE id IN (${placeholders})`,
    idea_ids
  );

  if (rows.length === 0) {
    return json({ error: 'No evaluations found for given ids' }, 404);
  }

  // Score each idea
  const scored = rows.map(row => {
    const scores = extractScores(row);
    return {
      idea_id: row.id,
      scores,
      weighted_total: weightedScore(scores, mergedWeights),
      title: row.result?.overall_assessment?.title || row.result?.title || 'Untitled',
    };
  });

  // Sort by weighted total descending
  scored.sort((a, b) => b.weighted_total - a.weighted_total);

  // Generate tradeoffs
  const tradeoffs = generateTradeoffs(scored, scored.map(s => s.scores));

  // Save session
  const sessionRows = await query(
    `INSERT INTO decision_sessions (user_id, idea_ids, criteria_weights, comparison_result)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [
      user?.id || null,
      JSON.stringify(idea_ids),
      JSON.stringify(mergedWeights),
      JSON.stringify({ ranked: scored, tradeoffs }),
    ]
  );

  return json({
    session_id: sessionRows[0].id,
    ranked: scored,
    tradeoffs,
    weights: mergedWeights,
    created_at: sessionRows[0].created_at,
  }, 201);
}

async function handleSession(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing session id' }, 400);

  const rows = await query(
    `SELECT * FROM decision_sessions WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) return json({ error: 'Session not found' }, 404);

  const session = rows[0];
  return json({
    session: {
      id: session.id,
      idea_ids: session.idea_ids,
      criteria_weights: session.criteria_weights,
      comparison_result: session.comparison_result,
      winner_id: session.winner_id,
      rationale: session.rationale,
      created_at: session.created_at,
    },
  });
}

async function handleDecide(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { session_id, winner_id, rationale } = body;

  if (!session_id) return json({ error: 'session_id is required' }, 400);
  if (!winner_id) return json({ error: 'winner_id is required' }, 400);

  const existing = await query('SELECT id FROM decision_sessions WHERE id = $1', [session_id]);
  if (existing.length === 0) return json({ error: 'Session not found' }, 404);

  await query(
    `UPDATE decision_sessions SET winner_id = $1, rationale = $2, updated_at = NOW() WHERE id = $3`,
    [winner_id, rationale || '', session_id]
  );

  return json({ decided: true, session_id, winner_id });
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
    if (action === 'compare' && req.method === 'POST') {
      result = await handleCompare(req);
    } else if (action === 'session' && req.method === 'GET') {
      result = await handleSession(req);
    } else if (action === 'decide' && req.method === 'POST') {
      result = await handleDecide(req);
    } else {
      result = json({ error: 'Unknown action' }, 404);
    }

    const body = await result.text();
    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    console.error('Decisions error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
