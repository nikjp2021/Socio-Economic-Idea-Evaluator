/**
 * Reference data API — serves all static reference data from Neon DB.
 * GET /api/reference?data=personas|cases|countries|sdgs|templates|figures|leaderboard|stats|quick-eval
 *
 * Filters (depending on data type):
 *   &zone=... &category=... &country=... &code=... &verdict=... &limit=...
 */

import { query, initDB } from './db.mjs';

let _dbReady = false;

async function ensureDB() {
  if (!_dbReady) {
    await initDB();
    _dbReady = true;
  }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Handlers ───

async function handlePersonas(params) {
  const zone = params.zone;
  if (zone) {
    return await query(
      `SELECT * FROM mentor_personas WHERE zone = $1 ORDER BY name`, [zone]
    );
  }
  return await query(`SELECT * FROM mentor_personas ORDER BY name`);
}

async function handleCases(params) {
  const { category, country, zone, limit } = params;
  const conditions = [];
  const args = [];
  let i = 1;

  if (category) { conditions.push(`category = $${i++}`); args.push(category); }
  if (country) { conditions.push(`country = $${i++}`); args.push(country); }
  if (zone) { conditions.push(`zone = $${i++}`); args.push(zone); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const lim = Math.min(parseInt(limit) || 100, 200);

  return await query(
    `SELECT id, title, organization, founders, founded, country, zone, category,
            problem_statement, key_lesson, status, impact, what_worked, what_didnt
     FROM case_studies ${where} ORDER BY title LIMIT $${i}`,
    [...args, lim]
  );
}

async function handleCountries(params) {
  const { code, zone, tier } = params;
  if (code) {
    const rows = await query(`SELECT * FROM countries WHERE code = $1`, [code.toUpperCase()]);
    return rows[0] || null;
  }
  const conditions = [];
  const args = [];
  let i = 1;
  if (zone) { conditions.push(`zone = $${i++}`); args.push(zone); }
  if (tier) { conditions.push(`economic_tier = $${i++}`); args.push(tier); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return await query(`SELECT code, name, region, zone, economic_tier, pdi, idv, mas, uai, lto, ivr FROM countries ${where} ORDER BY name`, args);
}

async function handleSDGs() {
  return await query(`SELECT * FROM sdg_data ORDER BY number`);
}

async function handleTemplates(params) {
  const { category, zone } = params;
  const conditions = [];
  const args = [];
  let i = 1;
  if (category) { conditions.push(`category = $${i++}`); args.push(category); }
  if (zone) { conditions.push(`zone = $${i++}`); args.push(zone); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return await query(`SELECT id, label, category, country, zone, economic_tier, score, verdict FROM idea_templates ${where} ORDER BY label`, args);
}

async function handleTemplateResult(params) {
  const { id } = params;
  if (!id) return null;
  const rows = await query(`SELECT * FROM idea_templates WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function handleFigures(params) {
  const { country, limit } = params;
  const lim = Math.min(parseInt(limit) || 50, 100);
  if (country) {
    return await query(`SELECT * FROM figures WHERE country = $1 ORDER BY name LIMIT $2`, [country, lim]);
  }
  return await query(`SELECT * FROM figures ORDER BY name LIMIT $1`, [lim]);
}

async function handleLeaderboard(params) {
  const limit = Math.min(parseInt(params.limit) || 20, 50);
  const badge = params.badge;

  let where = `WHERE status = 'approved'`;
  const args = [];
  let i = 1;

  if (badge && badge !== 'all') {
    where += ` AND badge = $${i++}`;
    args.push(badge);
  }

  return await query(
    `SELECT ml.id, ml.badge, ml.badge_label, ml.hook, ml.idea_type, ml.region,
            ml.sdg_tags, ml.upvotes, ml.created_at,
            e.score, e.verdict, e.country, e.idea_type as eval_type
     FROM marketplace_listings ml
     LEFT JOIN evaluations e ON ml.evaluation_id = e.id
     ${where}
     ORDER BY ml.upvotes DESC, ml.created_at DESC
     LIMIT $${i}`,
    [...args, limit]
  );
}

async function handleStats() {
  const [evalCount] = await query(`SELECT COUNT(*) as total FROM evaluations`);
  const [userCount] = await query(`SELECT COUNT(*) as total FROM users`);
  const [caseCount] = await query(`SELECT COUNT(*) as total FROM case_studies`);
  const [personaCount] = await query(`SELECT COUNT(*) as total FROM mentor_personas`);
  const [countryCount] = await query(`SELECT COUNT(*) as total FROM countries`);

  const topTypes = await query(
    `SELECT idea_type, COUNT(*) as count FROM evaluations
     WHERE idea_type IS NOT NULL GROUP BY idea_type ORDER BY count DESC LIMIT 10`
  );

  const topCountries = await query(
    `SELECT country, COUNT(*) as count FROM evaluations
     WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10`
  );

  const recentVerdicts = await query(
    `SELECT verdict, COUNT(*) as count FROM evaluations
     WHERE verdict IS NOT NULL GROUP BY verdict ORDER BY count DESC`
  );

  return {
    total_evaluations: parseInt(evalCount.total),
    total_users: parseInt(userCount.total),
    total_case_studies: parseInt(caseCount.total),
    total_personas: parseInt(personaCount.total),
    total_countries: parseInt(countryCount.total),
    top_idea_types: topTypes,
    top_countries: topCountries,
    verdict_distribution: recentVerdicts,
  };
}

async function handleQuickEval(params) {
  const { id } = params;
  if (id) {
    return await handleTemplateResult(params);
  }
  return await handleTemplates(params);
}

async function handleSimilar(params) {
  const { idea_type, country, zone, limit } = params;
  const lim = Math.min(parseInt(limit) || 5, 20);
  const conditions = [];
  const args = [];
  let i = 1;

  if (idea_type) { conditions.push(`idea_type = $${i++}`); args.push(idea_type); }
  if (country) { conditions.push(`country = $${i++}`); args.push(country); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return await query(
    `SELECT id, idea_text, country, idea_type, score, verdict, verdict_label, sdg_tags, created_at
     FROM evaluations ${where} ORDER BY created_at DESC LIMIT $${i}`,
    [...args, lim]
  );
}

async function handleCountryDeep(params) {
  const code = (params.code || '').toUpperCase();
  if (!code) return null;

  const [country] = await query(`SELECT * FROM countries WHERE code = $1`, [code]);
  if (!country) return null;

  const cases = await query(
    `SELECT id, title, organization, category, key_lesson, impact FROM case_studies WHERE country = $1 LIMIT 10`, [code]
  );

  const personas = await query(
    `SELECT id, name, title, quote FROM mentor_personas WHERE country = $1`, [code]
  );

  const recentEvals = await query(
    `SELECT id, idea_text, score, verdict, created_at FROM evaluations WHERE country = $1 ORDER BY created_at DESC LIMIT 5`, [code]
  );

  return { country, case_studies: cases, personas, recent_evaluations: recentEvals };
}

async function handleDashboard(params, authHeader) {
  // Extract user from token
  const { verifyToken } = await import('./auth.mjs');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { error: 'Authentication required' };

  const payload = verifyToken(token);
  if (!payload?.sub) return { error: 'Invalid token' };

  const userId = payload.sub;

  const evaluations = await query(
    `SELECT id, idea_text, country, idea_type, score, verdict, verdict_label, created_at
     FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]
  );

  const [stats] = await query(
    `SELECT COUNT(*) as total, AVG(score) as avg_score,
            MIN(score) as min_score, MAX(score) as max_score
     FROM evaluations WHERE user_id = $1`, [userId]
  );

  const typeBreakdown = await query(
    `SELECT idea_type, COUNT(*) as count FROM evaluations
     WHERE user_id = $1 AND idea_type IS NOT NULL
     GROUP BY idea_type ORDER BY count DESC`, [userId]
  );

  const verdictBreakdown = await query(
    `SELECT verdict, COUNT(*) as count FROM evaluations
     WHERE user_id = $1 AND verdict IS NOT NULL
     GROUP BY verdict ORDER BY count DESC`, [userId]
  );

  return {
    evaluations,
    stats: {
      total: parseInt(stats.total),
      avg_score: stats.avg_score ? parseFloat(stats.avg_score).toFixed(1) : null,
      min_score: stats.min_score ? parseFloat(stats.min_score).toFixed(1) : null,
      max_score: stats.max_score ? parseFloat(stats.max_score).toFixed(1) : null,
    },
    type_breakdown: typeBreakdown,
    verdict_breakdown: verdictBreakdown,
  };
}

// ─── Main handler ───
export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    await ensureDB();

    const params = req.query || {};
    const data = params.data || '';
    let result;

    switch (data) {
      case 'personas': result = await handlePersonas(params); break;
      case 'cases': result = await handleCases(params); break;
      case 'countries': result = await handleCountries(params); break;
      case 'sdgs': result = await handleSDGs(); break;
      case 'templates': result = await handleTemplates(params); break;
      case 'template': result = await handleTemplateResult(params); break;
      case 'figures': result = await handleFigures(params); break;
      case 'leaderboard': result = await handleLeaderboard(params); break;
      case 'stats': result = await handleStats(); break;
      case 'quick-eval': result = await handleQuickEval(params); break;
      case 'similar': result = await handleSimilar(params); break;
      case 'country': result = await handleCountryDeep(params); break;
      case 'dashboard': result = await handleDashboard(params, req.headers.authorization); break;
      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing ?data= parameter. Options: personas, cases, countries, sdgs, templates, figures, leaderboard, stats, quick-eval, similar, country, dashboard' }));
        return;
    }

    if (result === null) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' });
    res.end(JSON.stringify({ ok: true, data: result }));
  } catch (err) {
    console.error('Reference API error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
