-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Form progress table (for auto-save functionality)
CREATE TABLE IF NOT EXISTS form_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL, -- JSON string
  current_step INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_progress_user ON form_progress(user_id);

-- Form submissions table (completed forms)
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL, -- JSON string
  submitted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_date ON form_submissions(submitted_at);

-- AI usage tracking table (for rate limiting and usage statistics)
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL, -- 'autofill', 'improve', 'validate'
  tokens_used INTEGER,
  cost_estimate REAL, -- Estimated cost in dollars
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time ON ai_usage(user_id, created_at);

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_window ON rate_limits(user_id, window_start);

