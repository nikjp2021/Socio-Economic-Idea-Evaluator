import { query, initDB } from './db.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'see-dev-secret-change-in-production';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;

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

// ─── JWT Helpers ───

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

function extractToken(req) {
  const auth = req.headers?.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/**
 * Middleware: extract user from JWT. Returns user object or null.
 * Does NOT reject — endpoints decide whether auth is required.
 */
export async function getUserFromRequest(req) {
  const token = extractToken(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  try {
    const rows = await query(
      'SELECT id, email, name, created_at, last_login FROM users WHERE id = $1 AND is_active = true',
      [payload.sub]
    );
    return rows[0] || null;
  } catch (_) {
    return null;
  }
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
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Validation ───

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 8;
}

// ─── Handlers ───

async function handleRegister(req) {
  const body = await readBody(req);
  const { email, password, name } = body;

  if (!email || !validateEmail(email)) {
    return json({ error: 'Valid email is required' }, 400);
  }
  if (!password || !validatePassword(password)) {
    return json({ error: 'Password must be at least 8 characters' }, 400);
  }
  if (!name || name.trim().length < 2) {
    return json({ error: 'Name is required (min 2 characters)' }, 400);
  }

  const emailNorm = email.toLowerCase().trim();

  // Check existing
  const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
  if (existing.length > 0) {
    return json({ error: 'An account with this email already exists' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const rows = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [emailNorm, passwordHash, name.trim()]
  );

  const user = rows[0];

  // Create empty profile
  await query(
    'INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [user.id]
  );

  // Track analytics
  await query(
    `INSERT INTO evaluation_analytics (user_id, event_type, metadata)
     VALUES ($1, 'user_register', '{"source": "web"}')`,
    [user.id]
  ).catch(() => {});

  const token = signToken({ sub: user.id, email: user.email });

  return json({
    token,
    user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
  }, 201);
}

async function handleLogin(req) {
  const body = await readBody(req);
  const { email, password } = body;

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const emailNorm = email.toLowerCase().trim();

  const rows = await query(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1 AND is_active = true',
    [emailNorm]
  );

  if (rows.length === 0) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  // Update last_login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]).catch(() => {});

  // Track analytics
  await query(
    `INSERT INTO evaluation_analytics (user_id, event_type, metadata)
     VALUES ($1, 'user_login', '{"source": "web"}')`,
    [user.id]
  ).catch(() => {});

  const token = signToken({ sub: user.id, email: user.email });

  return json({
    token,
    user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
  });
}

async function handleMe(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  // Get profile
  const profiles = await query(
    'SELECT role, organization, country, bio, goals, avatar_url FROM user_profiles WHERE user_id = $1',
    [user.id]
  );

  // Get stats
  const stats = await query(
    `SELECT
       COUNT(*) as total_evaluations,
       COUNT(CASE WHEN verdict = 'gold' OR verdict_label ILIKE '%gold%' THEN 1 END) as gold_count,
       MAX(created_at) as last_evaluation
     FROM evaluations WHERE user_id = $1`,
    [user.id]
  );

  return json({
    user,
    profile: profiles[0] || null,
    stats: stats[0] || { total_evaluations: '0', gold_count: '0', last_evaluation: null },
  });
}

async function handleUpdateProfile(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const body = await readBody(req);
  const { name, role, organization, country, bio, goals } = body;

  if (name) {
    await query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), user.id]);
  }

  await query(
    `INSERT INTO user_profiles (user_id, role, organization, country, bio, goals, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       role = COALESCE(EXCLUDED.role, user_profiles.role),
       organization = COALESCE(EXCLUDED.organization, user_profiles.organization),
       country = COALESCE(EXCLUDED.country, user_profiles.country),
       bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
       goals = COALESCE(EXCLUDED.goals, user_profiles.goals),
       updated_at = NOW()`,
    [user.id, role || '', organization || '', country || '', bio || '', goals || '']
  );

  return json({ ok: true });
}

// ─── Vercel Handler ───

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action') || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors());
    res.end();
    return;
  }

  try {
    await initDB();

    let result;
    if (action === 'register' && req.method === 'POST') {
      result = await handleRegister(req);
    } else if (action === 'login' && req.method === 'POST') {
      result = await handleLogin(req);
    } else if (action === 'me' && req.method === 'GET') {
      result = await handleMe(req);
    } else if (action === 'profile' && req.method === 'POST') {
      result = await handleUpdateProfile(req);
    } else {
      result = json({ error: 'Unknown action' }, 404);
    }

    const body = await result.text();
    res.writeHead(result.status, { ...cors(), 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    console.error('Auth error:', err);
    res.writeHead(500, { ...cors(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
