# Database Schema Documentation

## Overview

This document describes the database schema for the Smart Form Assistant application. The system uses **Cloudflare D1** (SQLite) for primary data storage and **Cloudflare KV** for session management.

## Technology Stack

### Cloudflare D1 (SQLite)
- **Purpose**: Persistent data storage
- **Why**: Native integration with Workers, low latency, free tier
- **Version**: SQLite 3.x compatible
- **Location**: Distributed globally on Cloudflare's edge

### Cloudflare KV
- **Purpose**: Session storage
- **Why**: TTL support, global replication, fast key-value access
- **TTL**: 24 hours for sessions, 15 minutes for magic links

## D1 Schema (SQL)

### 1. Users Table

Stores user account information.

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Fields:**
- `id` (TEXT): Unique user identifier (nanoid, 21 chars)
- `email` (TEXT): User's email address, unique, used for authentication
- `created_at` (INTEGER): Unix timestamp of account creation

**Indexes:**
- `idx_users_email`: Fast lookup by email during authentication

**Notes:**
- No password field (magic link authentication)
- nanoid provides collision-resistant IDs without sequential guessing risk
- Email uniqueness enforced at database level

---

### 2. Form Progress Table

Stores draft/in-progress form submissions for auto-save functionality.

```sql
CREATE TABLE IF NOT EXISTS form_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_progress_user ON form_progress(user_id);
```

**Fields:**
- `id` (TEXT): Unique progress record ID (nanoid)
- `user_id` (TEXT): Foreign key to users table
- `form_data` (TEXT): JSON string containing partial form data
- `current_step` (INTEGER): Current step (1-4) user is on
- `updated_at` (INTEGER): Unix timestamp of last update

**Indexes:**
- `idx_form_progress_user`: Fast lookup of user's progress

**Relationships:**
- Foreign key to `users(id)` with CASCADE delete
- One-to-one: Each user has at most one progress record (upsert pattern)

**JSON Structure (form_data):**
```json
{
  "step1": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "step2": {
    "currentPosition": "string",
    "company": "string",
    "yearsOfExperience": number,
    "keyAchievements": "string"
  },
  "step3": {
    "primarySkills": "string",
    "programmingLanguages": "string",
    "frameworksAndTools": "string"
  },
  "step4": {
    "motivation": "string",
    "startDate": "string",
    "expectedSalary": "string?"
  }
}
```

**Notes:**
- Deleted when form is submitted (clean slate)
- Updated via upsert (INSERT or UPDATE)
- JSON allows flexible schema evolution

---

### 3. Form Submissions Table

Stores completed and submitted form applications.

```sql
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_date ON form_submissions(submitted_at);
```

**Fields:**
- `id` (TEXT): Unique submission ID (nanoid)
- `user_id` (TEXT): Foreign key to users table
- `form_data` (TEXT): JSON string containing complete form data
- `submitted_at` (INTEGER): Unix timestamp of submission

**Indexes:**
- `idx_form_submissions_user`: List user's submissions
- `idx_form_submissions_date`: Time-based queries (recent submissions)

**Relationships:**
- Foreign key to `users(id)` with CASCADE delete
- One-to-many: User can have multiple submissions

**Notes:**
- Immutable after creation (no updates)
- Same JSON structure as form_progress but complete
- Serves as audit trail

---

### 4. AI Usage Table

Tracks AI API calls for rate limiting and analytics.

```sql
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER,
  cost_estimate REAL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time ON ai_usage(user_id, created_at);
```

**Fields:**
- `id` (TEXT): Unique usage record ID (nanoid)
- `user_id` (TEXT): Foreign key to users table
- `endpoint` (TEXT): AI feature used ('autofill', 'improve', 'validate')
- `tokens_used` (INTEGER): Number of tokens consumed
- `cost_estimate` (REAL): Estimated cost in USD (for tracking)
- `created_at` (INTEGER): Unix timestamp of request

**Indexes:**
- `idx_ai_usage_user_time`: Composite index for rate limiting queries

**Relationships:**
- Foreign key to `users(id)` with CASCADE delete
- One-to-many: User has many usage records

**Endpoint Values:**
- `'autofill'`: Resume extraction feature
- `'improve'`: Text improvement feature
- `'validate'`: Form validation feature (bonus)

**Notes:**
- Written on every AI API call
- Used for rate limiting (count last 5 minutes)
- Analytics for feature usage
- cost_estimate tracks hypothetical costs (Gemini is free tier)

---

### 5. Rate Limits Table

Tracks rate limit windows (optional, can be calculated from ai_usage).

```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_window ON rate_limits(user_id, window_start);
```

**Fields:**
- `id` (TEXT): Unique rate limit record ID
- `user_id` (TEXT): Foreign key to users table
- `window_start` (INTEGER): Start of 5-minute window
- `request_count` (INTEGER): Requests in this window

**Notes:**
- **Currently unused** - rate limiting calculated from ai_usage table
- Kept for future optimization (pre-aggregated counts)
- Would reduce query load for high-traffic scenarios

---

## KV Schema (Key-Value Store)

### 1. Session Storage

**Key Pattern:** `session:{token}`

**Value Structure:**
```json
{
  "userId": "string (nanoid)",
  "email": "string",
  "expiresAt": number (unix timestamp)
}
```

**TTL:** 24 hours (86400 seconds)

**Usage:**
- Created on successful magic link verification
- Read on every authenticated request
- Deleted on logout

**Example:**
```
Key: session:5F3Z9K2L8M1N4P6Q7R8S9T0U1V2W3X4Y
Value: {"userId":"abc123","email":"user@example.com","expiresAt":1704153600000}
TTL: 86400
```

---

### 2. Magic Link Tokens

**Key Pattern:** `magic:{token}`

**Value Structure:**
```json
{
  "email": "string",
  "expiresAt": number (unix timestamp)
}
```

**TTL:** 15 minutes (900 seconds)

**Usage:**
- Created when user requests magic link
- Read once when user clicks link
- Deleted after verification (single-use)

**Example:**
```
Key: magic:9A8B7C6D5E4F3G2H1I0J9K8L7M6N5O4P
Value: {"email":"user@example.com","expiresAt":1704148500000}
TTL: 900
```

---

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │◄─────┐
│ email       │      │
│ created_at  │      │
└─────────────┘      │
                     │
         ┌───────────┼───────────┬───────────┐
         │           │           │           │
         │           │           │           │
┌────────▼─────┐ ┌──▼──────────┐ ┌─▼─────────────┐
│form_progress│ │form_submiss │ │   ai_usage    │
│─────────────│ │─────────────│ │───────────────│
│id (PK)      │ │id (PK)      │ │id (PK)        │
│user_id (FK) │ │user_id (FK) │ │user_id (FK)   │
│form_data    │ │form_data    │ │endpoint       │
│current_step │ │submitted_at │ │tokens_used    │
│updated_at   │ └─────────────┘ │cost_estimate  │
└─────────────┘                 │created_at     │
                                └───────────────┘
```

**Relationships:**
- `users` ──< `form_progress` (one-to-one, enforced in app logic)
- `users` ──< `form_submissions` (one-to-many)
- `users` ──< `ai_usage` (one-to-many)

---

## Query Patterns

### 1. Get User by Email (Authentication)
```sql
SELECT * FROM users WHERE email = ?;
```
**Index Used:** `idx_users_email`
**Performance:** O(log n) via B-tree

### 2. Load Form Progress
```sql
SELECT * FROM form_progress WHERE user_id = ?;
```
**Index Used:** `idx_form_progress_user`
**Performance:** O(log n) via B-tree

### 3. Check Rate Limit (Last 5 Minutes)
```sql
SELECT COUNT(*) as count 
FROM ai_usage 
WHERE user_id = ? 
AND created_at > ?;
```
**Parameters:** `user_id`, `now - 5 minutes`
**Index Used:** `idx_ai_usage_user_time`
**Performance:** O(log n + k) where k = matching rows

### 4. Get User Submissions (Ordered)
```sql
SELECT * FROM form_submissions 
WHERE user_id = ? 
ORDER BY submitted_at DESC;
```
**Index Used:** `idx_form_submissions_user`
**Performance:** O(log n + k) + sort

---

## Data Retention & Privacy

### GDPR Compliance
- **Right to Deletion**: CASCADE delete removes all user data
- **Data Minimization**: No unnecessary fields collected
- **Purpose Limitation**: Data used only for application functionality

### Cleanup Strategy
- **Sessions**: Auto-expire after 24 hours (KV TTL)
- **Magic Links**: Auto-expire after 15 minutes (KV TTL)
- **Form Progress**: Cleared after submission
- **AI Usage**: Retained indefinitely (anonymize after 90 days in production)

---

## Migrations

### Initial Migration
```bash
wrangler d1 execute forms_db --file=./schema.sql
```

### Future Migrations
Create numbered migration files:
```
migrations/
  001_initial_schema.sql
  002_add_validation_column.sql
  003_add_analytics_table.sql
```

---

## Backup Strategy

### D1 Backups
- Automatic snapshots by Cloudflare
- Manual export: `wrangler d1 export forms_db`
- Restore: `wrangler d1 execute forms_db --file=backup.sql`

### KV Backups
- Sessions are ephemeral (no backup needed)
- Magic links are single-use (no backup needed)

---

## Performance Considerations

### D1 Limits (Free Tier)
- 5 GB storage
- 5 million reads/day
- 100,000 writes/day
- 1000 writes/minute

**Our Usage (Estimated):**
- Reads: ~50 per user session = 100k users/day
- Writes: ~10 per submission = 10k forms/day
- Well within limits ✅

### Optimization Tips
1. **Indexes**: Already optimized for common queries
2. **JSON Fields**: Keep relatively small (<10KB)
3. **Pagination**: Add LIMIT/OFFSET for large result sets
4. **Caching**: Use KV for frequently accessed data

---

## Schema Version

**Current Version:** 1.0.0
**Last Updated:** 2024-01-15
**Schema Hash:** `sha256:a1b2c3d4e5f6...` (for migration tracking)

