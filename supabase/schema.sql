-- Mermicorn Command Board — mermicorn-core schema
-- Run this in your Supabase SQL editor to initialize

-- Constellation repo registry
CREATE TABLE IF NOT EXISTS constellation_repos (
  id           TEXT PRIMARY KEY,           -- repo slug
  display_name TEXT NOT NULL,
  lane         TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'public',
  status       TEXT NOT NULL DEFAULT 'active',
  github_url   TEXT,
  is_valid     BOOLEAN DEFAULT NULL,       -- NULL = not yet validated
  last_checked TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub event feed
CREATE TABLE IF NOT EXISTS github_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo         TEXT NOT NULL,
  event_type   TEXT NOT NULL,             -- push, pull_request, workflow_run, etc.
  payload      JSONB NOT NULL DEFAULT '{}',
  received_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AI observability log
CREATE TABLE IF NOT EXISTS ai_calls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL,             -- huggingface, openai, etc.
  model        TEXT NOT NULL,
  prompt_tokens   INT DEFAULT 0,
  response_tokens INT DEFAULT 0,
  latency_ms   INT,
  success      BOOLEAN NOT NULL DEFAULT TRUE,
  called_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Session state (edge-compatible, also synced to Neon)
CREATE TABLE IF NOT EXISTS session_state (
  user_id      TEXT PRIMARY KEY,
  last_panel   TEXT,
  preferences  JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_github_events_repo     ON github_events(repo);
CREATE INDEX IF NOT EXISTS idx_github_events_received ON github_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_provider      ON ai_calls(provider);
CREATE INDEX IF NOT EXISTS idx_ai_calls_called_at     ON ai_calls(called_at DESC);
