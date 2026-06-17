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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Matching Engine ───

function scoreMatch(source, criteria) {
  let score = 0;
  let maxScore = 0;

  // Country match (weight: 30)
  maxScore += 30;
  const countries = source.countries || [];
  if (countries.length === 0 || countries.includes('*')) {
    score += 30; // Global source
  } else if (criteria.country && countries.includes(criteria.country)) {
    score += 30;
  }

  // Zone match (weight: 20)
  maxScore += 20;
  const zones = source.zones || [];
  if (zones.length === 0 || zones.includes('*')) {
    score += 20;
  } else if (criteria.zone && zones.includes(criteria.zone)) {
    score += 20;
  }

  // SDG focus match (weight: 25)
  maxScore += 25;
  const sdgFocus = source.sdg_focus || [];
  if (sdgFocus.length === 0) {
    score += 25; // Accepts all SDGs
  } else if (criteria.sdg_tags && criteria.sdg_tags.length > 0) {
    const overlap = criteria.sdg_tags.filter(s => sdgFocus.includes(s));
    score += Math.round((overlap.length / criteria.sdg_tags.length) * 25);
  }

  // Idea type match (weight: 15)
  maxScore += 15;
  const ideaTypes = source.idea_types || [];
  if (ideaTypes.length === 0) {
    score += 15;
  } else if (criteria.idea_type && ideaTypes.includes(criteria.idea_type)) {
    score += 15;
  }

  // Economic tier match (weight: 10)
  maxScore += 10;
  const tiers = source.economic_tiers || [];
  if (tiers.length === 0) {
    score += 10;
  } else if (criteria.economic_tier && tiers.includes(criteria.economic_tier)) {
    score += 10;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// ─── Handlers ───

async function handleMatch(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const country = url.searchParams.get('country');
  const zone = url.searchParams.get('zone');
  const ideaType = url.searchParams.get('idea_type');
  const economicTier = url.searchParams.get('economic_tier');
  const sdgTags = url.searchParams.get('sdg_tags');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

  const criteria = {
    country: country || null,
    zone: zone || null,
    idea_type: ideaType || null,
    economic_tier: economicTier || null,
    sdg_tags: sdgTags ? sdgTags.split(',').map(Number).filter(n => !isNaN(n)) : [],
  };

  const rows = await query(
    `SELECT * FROM funding_sources WHERE status = 'active' ORDER BY created_at DESC`,
    []
  );

  const scored = rows.map(row => ({
    ...row,
    match_score: scoreMatch(row, criteria),
  }))
    .filter(r => r.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return json({ matches: scored, criteria });
}

async function handleListSources(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const type = url.searchParams.get('type');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  let sql = `SELECT id, name, type, description, min_amount, max_amount, currency,
                    countries, zones, sdg_focus, idea_types, url, deadline, status
             FROM funding_sources WHERE status = 'active'`;
  const params = [];

  if (type) {
    params.push(type);
    sql += ` AND type = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const rows = await query(sql, params);
  return json({ sources: rows });
}

async function handleCreateApplication(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { project_id, funding_source_id, notes } = body;

  if (!funding_source_id) return json({ error: 'funding_source_id is required' }, 400);

  // Verify funding source exists
  const source = await query('SELECT id FROM funding_sources WHERE id = $1', [funding_source_id]);
  if (source.length === 0) return json({ error: 'Funding source not found' }, 404);

  const rows = await query(
    `INSERT INTO funding_applications (user_id, project_id, funding_source_id, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, status, created_at`,
    [user?.id || null, project_id || null, funding_source_id, notes || '']
  );

  return json({ id: rows[0].id, status: rows[0].status, created_at: rows[0].created_at }, 201);
}

async function handleUpdateApplication(req) {
  const user = await getUserFromRequest(req);
  const body = await readBody(req);
  const { id, status: newStatus, notes } = body;

  if (!id) return json({ error: 'id is required' }, 400);

  const existing = await query('SELECT user_id FROM funding_applications WHERE id = $1', [id]);
  if (existing.length === 0) return json({ error: 'Application not found' }, 404);
  if (user && existing[0].user_id !== user.id) return json({ error: 'Not authorized' }, 403);

  const sets = [];
  const params = [];
  let idx = 1;

  if (newStatus) {
    sets.push(`status = $${idx++}`);
    params.push(newStatus);
    if (newStatus === 'submitted') {
      sets.push(`submitted_at = NOW()`);
    }
  }
  if (notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(notes); }

  if (sets.length === 0) return json({ error: 'Nothing to update' }, 400);

  sets.push(`updated_at = NOW()`);
  params.push(id);

  await query(
    `UPDATE funding_applications SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  );

  return json({ updated: true });
}

async function handleListApplications(req) {
  const user = await getUserFromRequest(req);
  if (!user) return json({ error: 'Login required' }, 401);

  const rows = await query(
    `SELECT fa.id, fa.status, fa.notes, fa.submitted_at, fa.created_at,
            fs.name as source_name, fs.type as source_type, fs.url as source_url,
            fs.min_amount, fs.max_amount, fs.currency,
            p.title as project_title
     FROM funding_applications fa
     JOIN funding_sources fs ON fa.funding_source_id = fs.id
     LEFT JOIN projects p ON fa.project_id = p.id
     WHERE fa.user_id = $1
     ORDER BY fa.created_at DESC`,
    [user.id]
  );

  return json({ applications: rows });
}

async function handleSeedFundingSources(req) {
  // Only allow with seed key
  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = url.searchParams.get('key');
  if (key !== 'see-seed-2024') return json({ error: 'Invalid seed key' }, 403);

  const sources = [
    {
      name: 'NLnet Foundation',
      type: 'grant',
      description: 'Funds open source projects that improve internet infrastructure and digital society.',
      min_amount: 5000, max_amount: 50000, currency: 'EUR',
      countries: ['*'], zones: ['*'], sdg_focus: [4, 9, 10, 16], idea_types: ['education', 'technology'],
      url: 'https://nlnet.nl/foundation/',
    },
    {
      name: 'Mozilla Foundation - MOSS',
      type: 'grant',
      description: 'Mozilla Open Source Support for projects that advance the open internet.',
      min_amount: 10000, max_amount: 100000, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [4, 9, 10, 16], idea_types: ['education', 'technology', 'community'],
      url: 'https://www.mozilla.org/en-US/moss/',
    },
    {
      name: 'GlobalGiving',
      type: 'crowdfunding',
      description: 'Crowdfunding platform for grassroots social impact projects worldwide.',
      min_amount: 500, max_amount: 50000, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'elderly', 'community', 'environment'],
      url: 'https://www.globalgiving.org/',
    },
    {
      name: 'Ashoka Fellowship',
      type: 'fellowship',
      description: 'Supports leading social entrepreneurs with a living stipend and access to a global network.',
      min_amount: 0, max_amount: 0, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [1, 2, 3, 4, 5, 6, 8, 10, 11, 16],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'community', 'financial', 'safety'],
      url: 'https://www.ashoka.org/fellowship',
    },
    {
      name: 'Skoll Foundation',
      type: 'grant',
      description: 'Invests in social entrepreneurs driving large-scale change.',
      min_amount: 50000, max_amount: 1000000, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [1, 2, 3, 4, 5, 8, 10, 13, 16],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'environment', 'community'],
      url: 'https://skoll.org/',
    },
    {
      name: 'UNDP Accelerator Labs',
      type: 'program',
      description: 'UNDP innovation labs that support grassroots solutions in developing countries.',
      min_amount: 5000, max_amount: 30000, currency: 'USD',
      countries: ['*'], zones: ['south_asia', 'east_africa', 'west_africa', 'latin_america', 'mena', 'southeast_asia'],
      sdg_focus: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'elderly', 'community', 'environment', 'energy'],
      url: 'https://acceleratorlabs.undp.org/',
    },
    {
      name: 'Grameen Foundation',
      type: 'microfinance',
      description: 'Microfinance and financial inclusion for the poorest communities.',
      min_amount: 100, max_amount: 5000, currency: 'USD',
      countries: ['BD', 'IN', 'KE', 'UG', 'PH', 'NG', 'ET'],
      zones: ['south_asia', 'east_africa', 'west_africa', 'southeast_asia'],
      sdg_focus: [1, 2, 8, 10], idea_types: ['financial', 'food', 'women', 'community'],
      url: 'https://grameenfoundation.org/',
    },
    {
      name: 'Acumen Fund',
      type: 'impact_investment',
      description: 'Patient capital for enterprises serving the poor.',
      min_amount: 50000, max_amount: 500000, currency: 'USD',
      countries: ['IN', 'KE', 'CO', 'PK', 'GH', 'NG'],
      zones: ['south_asia', 'east_africa', 'west_africa', 'latin_america'],
      sdg_focus: [1, 2, 3, 4, 6, 7, 8], idea_types: ['health', 'education', 'food', 'water', 'energy', 'financial'],
      url: 'https://acumen.org/',
    },
    {
      name: 'Echoing Green',
      type: 'fellowship',
      description: 'Seed-stage funding and support for emerging social entrepreneurs.',
      min_amount: 80000, max_amount: 80000, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [1, 2, 3, 4, 5, 6, 8, 10, 11, 13, 16],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'safety', 'community', 'environment'],
      url: 'https://www.echoinggreen.org/',
    },
    {
      name: 'CSR India - Tata Trusts',
      type: 'csr',
      description: 'Corporate social responsibility funding for community development in India.',
      min_amount: 10000, max_amount: 200000, currency: 'INR',
      countries: ['IN'], zones: ['south_asia'], sdg_focus: [1, 2, 3, 4, 5, 6, 8, 10],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'elderly', 'community'],
      url: 'https://www.tatatrusts.org/',
    },
    {
      name: 'Safaricom Foundation',
      type: 'csr',
      description: 'Kenya-focused CSR for education, health, and environmental conservation.',
      min_amount: 5000, max_amount: 100000, currency: 'KES',
      countries: ['KE'], zones: ['east_africa'], sdg_focus: [2, 3, 4, 6, 7, 13],
      idea_types: ['health', 'education', 'food', 'water', 'environment', 'energy'],
      url: 'https://safaricom.co.ke/foundation',
    },
    {
      name: 'JICA Grassroots Grant',
      type: 'grant',
      description: 'Japan International Cooperation Agency funding for community-level projects.',
      min_amount: 100000, max_amount: 10000000, currency: 'JPY',
      countries: ['JP'], zones: ['east_asia'], sdg_focus: [1, 2, 3, 4, 5, 6, 8, 10, 13, 16],
      idea_types: ['health', 'education', 'food', 'water', 'women', 'elderly', 'community'],
      url: 'https://www.jica.go.jp/english/',
    },
    {
      name: 'Kiva Microloans',
      type: 'microfinance',
      description: 'Crowdfunded microloans for entrepreneurs in underserved communities worldwide.',
      min_amount: 25, max_amount: 10000, currency: 'USD',
      countries: ['*'], zones: ['*'], sdg_focus: [1, 2, 5, 8, 10],
      idea_types: ['financial', 'food', 'women', 'community', 'work'],
      url: 'https://www.kiva.org/',
    },
    {
      name: 'Bill & Melinda Gates Foundation - Grand Challenges',
      type: 'grant',
      description: 'Funds innovative solutions to global health and development problems.',
      min_amount: 100000, max_amount: 1000000, currency: 'USD',
      countries: ['*'], zones: ['south_asia', 'east_africa', 'west_africa', 'mena'],
      sdg_focus: [1, 2, 3, 4, 6], idea_types: ['health', 'food', 'water', 'education'],
      url: 'https://www.grandchallenges.org/',
    },
    {
      name: 'Wellcome Trust - Diversity in Science',
      type: 'grant',
      description: 'Funds health research and innovation in low-resource settings.',
      min_amount: 50000, max_amount: 500000, currency: 'GBP',
      countries: ['*'], zones: ['south_asia', 'east_africa', 'west_africa', 'mena', 'latin_america'],
      sdg_focus: [3, 4], idea_types: ['health', 'mental_health'],
      url: 'https://wellcome.org/',
    },
  ];

  let inserted = 0;
  for (const s of sources) {
    await query(
      `INSERT INTO funding_sources (name, type, description, min_amount, max_amount, currency,
                                    countries, zones, sdg_focus, idea_types, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [
        s.name, s.type, s.description, s.min_amount, s.max_amount, s.currency,
        JSON.stringify(s.countries), JSON.stringify(s.zones), JSON.stringify(s.sdg_focus),
        JSON.stringify(s.idea_types), s.url,
      ]
    ).then(() => inserted++).catch(() => {});
  }

  return json({ seeded: inserted, total: sources.length });
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
    if (action === 'match' && req.method === 'GET') {
      result = await handleMatch(req);
    } else if (action === 'list' && req.method === 'GET') {
      result = await handleListSources(req);
    } else if (action === 'apply' && req.method === 'POST') {
      result = await handleCreateApplication(req);
    } else if (action === 'update-application' && req.method === 'POST') {
      result = await handleUpdateApplication(req);
    } else if (action === 'applications' && req.method === 'GET') {
      result = await handleListApplications(req);
    } else if (action === 'seed' && req.method === 'POST') {
      result = await handleSeedFundingSources(req);
    } else {
      result = json({ error: 'Unknown action' }, 404);
    }

    const body = await result.text();
    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    console.error('Funding error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
