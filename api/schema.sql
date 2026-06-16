-- SEE — Socio-Economic Evaluator
-- Database Schema for Neon PostgreSQL
-- Run: npx neondb schema.sql  OR  psql $DATABASE_URL -f schema.sql

-- Users (auth core)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- User profiles (extended)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT '',
  organization VARCHAR(255) DEFAULT '',
  country VARCHAR(100) DEFAULT '',
  bio TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  avatar_url VARCHAR(500) DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluations (full history per user)
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
);

-- Mentor matches (per-evaluation snapshots)
CREATE TABLE IF NOT EXISTS mentor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  persona_id VARCHAR(100) NOT NULL,
  persona_name VARCHAR(255) NOT NULL,
  match_score INTEGER DEFAULT 0,
  playbook_tier VARCHAR(50),
  playbook_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites (bookmarked evaluations/ideas)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  fav_type VARCHAR(50) NOT NULL DEFAULT 'evaluation',
  title VARCHAR(500) DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, evaluation_id, fav_type)
);

-- Marketplace listings (public gallery)
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
);

-- Evaluation analytics (usage patterns)
CREATE TABLE IF NOT EXISTS evaluation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_matches_evaluation ON mentor_matches(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON evaluation_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON evaluation_analytics(event_type, created_at DESC);
