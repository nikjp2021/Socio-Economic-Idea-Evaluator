import { neon } from '@neondatabase/serverless';

// Lazy-initialized SQL tagged template function
let _sql = null;

function getSQL() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  _sql = neon(url);
  return _sql;
}

/**
 * Execute a parameterized query.
 * Usage: await query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query(text, params = []) {
  const sql = getSQL();
  return sql.query(text, params);
}

/**
 * Execute a raw SQL tagged template literal.
 * Usage: await sql`SELECT * FROM users WHERE id = ${userId}`
 */
export { getSQL as sql };

/**
 * Initialize database tables. Idempotent — safe to call on every cold start.
 */
export async function initDB() {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(100) DEFAULT '',
      organization VARCHAR(255) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      bio TEXT DEFAULT '',
      goals TEXT DEFAULT '',
      avatar_url VARCHAR(500) DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      session_id VARCHAR(255),
      idea_text TEXT NOT NULL,
      country VARCHAR(100),
      idea_type VARCHAR(100),
      economic_tier VARCHAR(10),
      score NUMERIC(4,1),
      verdict VARCHAR(50),
      verdict_label VARCHAR(100),
      sdg_tags JSONB DEFAULT '[]',
      result_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS mentor_matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
      persona_id VARCHAR(100) NOT NULL,
      persona_name VARCHAR(255) NOT NULL,
      match_score INTEGER DEFAULT 0,
      playbook_tier VARCHAR(50),
      playbook_json JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
      fav_type VARCHAR(50) NOT NULL DEFAULT 'evaluation',
      title VARCHAR(500) DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, evaluation_id, fav_type)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      badge VARCHAR(20) NOT NULL DEFAULT 'developing',
      badge_label VARCHAR(100) DEFAULT '',
      hook TEXT NOT NULL,
      idea_type VARCHAR(100) DEFAULT 'Social Impact',
      region VARCHAR(100) DEFAULT '',
      sdg_tags JSONB DEFAULT '[]',
      status VARCHAR(20) NOT NULL DEFAULT 'approved',
      upvotes INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evaluation_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event_type VARCHAR(100) NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mentor_matches_evaluation ON mentor_matches(evaluation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_user ON evaluation_analytics(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event ON evaluation_analytics(event_type, created_at DESC)`;

  // ─── Reference data tables ───

  await sql`
    CREATE TABLE IF NOT EXISTS mentor_personas (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(500),
      country VARCHAR(10),
      zone VARCHAR(100),
      country_tier VARCHAR(10),
      bio TEXT,
      philosophy TEXT,
      quote TEXT,
      categories JSONB DEFAULT '[]',
      specialties JSONB DEFAULT '[]',
      barrier_strengths JSONB DEFAULT '[]',
      model_stages JSONB DEFAULT '{}',
      playbook JSONB DEFAULT '{}',
      warning TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS case_studies (
      id VARCHAR(200) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      organization VARCHAR(500),
      founders JSONB DEFAULT '[]',
      founded INTEGER,
      country VARCHAR(10),
      zone VARCHAR(100),
      category VARCHAR(100),
      problem_statement TEXT,
      the_model TEXT,
      impact JSONB DEFAULT '{}',
      what_worked JSONB DEFAULT '[]',
      what_didnt JSONB DEFAULT '[]',
      key_lesson TEXT,
      status VARCHAR(100),
      applicable_to JSONB DEFAULT '[]',
      economic_tier JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS countries (
      code VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(100),
      zone VARCHAR(100),
      income_level VARCHAR(100),
      economic_tier VARCHAR(20),
      pdi INTEGER,
      idv INTEGER,
      mas INTEGER,
      uai INTEGER,
      lto INTEGER,
      ivr INTEGER,
      cultural_profile JSONB DEFAULT '{}',
      funding_sources JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sdg_data (
      number INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color VARCHAR(20),
      targets JSONB DEFAULT '[]',
      idea_types JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS idea_templates (
      id VARCHAR(200) PRIMARY KEY,
      label VARCHAR(500) NOT NULL,
      category VARCHAR(100),
      country VARCHAR(10),
      zone VARCHAR(100),
      economic_tier VARCHAR(10),
      problem TEXT,
      goal TEXT,
      sample_result JSONB NOT NULL,
      score NUMERIC(4,1),
      verdict VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS figures (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(10),
      role VARCHAR(500),
      organization VARCHAR(500),
      impact TEXT,
      quote TEXT,
      source VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Reference data indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_case_studies_category ON case_studies(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_studies_country ON case_studies(country)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_studies_zone ON case_studies(zone)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_countries_zone ON countries(zone)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mentor_personas_zone ON mentor_personas(zone)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_idea_templates_category ON idea_templates(category)`;
}
