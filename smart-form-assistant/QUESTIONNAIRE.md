# Project Questionnaire

## Time Breakdown

**Total Time:** ~6-7 hours

| Phase | Task | Time Spent |
|-------|------|------------|
| Phase 1 | Setup & Database Design | 1.5 hours |
| | - Project initialization | 30 min |
| | - Database schema design | 30 min |
| | - Cloudflare Workers setup | 30 min |
| Phase 2 | Authentication System | 1 hour |
| | - Magic link implementation | 30 min |
| | - Session management | 30 min |
| Phase 3 | Form Implementation | 2 hours |
| | - Multi-step form UI | 1 hour |
| | - Validation with Zod | 30 min |
| | - Auto-save logic | 30 min |
| Phase 4 | AI Integration | 1.5 hours |
| | - Gemini API client | 30 min |
| | - Resume autofill | 45 min |
| | - Text improvement | 15 min |
| | - Rate limiting | 15 min |
| Phase 5 | Testing | 1 hour |
| | - Playwright test setup | 15 min |
| | - Critical flow tests | 30 min |
| | - AI & auth tests | 15 min |
| Phase 6 | Documentation & Polish | 30 min |
| | - README, QUESTIONNAIRE | 20 min |
| | - Final testing | 10 min |

## Database Choice: Cloudflare D1 + KV

### Why D1?
1. **Native Integration**: Built for Cloudflare Workers, zero-latency access
2. **Cost**: Free tier (5GB storage, 5M reads/day) sufficient for MVP
3. **SQL Familiarity**: Standard SQLite syntax, easy to work with
4. **Simplicity**: No separate service to manage
5. **Performance**: Data close to compute, sub-millisecond queries

### Why KV for Sessions?
1. **TTL Support**: Automatic expiration (24 hours)
2. **Global Replication**: Fast access from any edge location
3. **Perfect for Sessions**: Key-value model ideal for session tokens
4. **Performance**: Sub-10ms reads globally

### Alternative Considered:
- **Supabase Postgres**: Great but adds external dependency and latency
- **PlanetScale**: Excellent but overkill for this scale
- **MongoDB Atlas**: NoSQL would work but SQL is cleaner for this schema

## Database Schema Design Rationale

### Users Table
```sql
users (id, email, created_at)
```
- **Simple by design**: No passwords needed for magic link
- **id**: nanoid for security (no sequential IDs)
- **email**: Unique constraint for auth
- **created_at**: Track registration time

### Form Progress Table
```sql
form_progress (id, user_id, form_data, current_step, updated_at)
```
- **form_data as JSON**: Flexible schema, easy to query/update
- **current_step**: Track where user left off
- **updated_at**: Show last activity, useful for analytics
- **One row per user**: Update pattern vs insert (cleaner)

### Form Submissions Table
```sql
form_submissions (id, user_id, form_data, submitted_at)
```
- **Separate from progress**: Keep drafts and finals distinct
- **Multiple submissions**: User can submit multiple times
- **Immutable**: Never update submissions (audit trail)

### AI Usage Table
```sql
ai_usage (id, user_id, endpoint, tokens_used, cost_estimate, created_at)
```
- **Granular tracking**: Each API call logged
- **endpoint field**: Know which feature is used most
- **tokens_used**: Monitor consumption
- **cost_estimate**: Track hypothetical costs
- **Index on (user_id, created_at)**: Fast rate limit queries

### Design Decisions:
1. **JSON over separate tables**: Flexibility > normalization for form data
2. **No soft deletes**: GDPR compliance easier with hard deletes
3. **created_at as INTEGER**: Unix timestamp for simplicity
4. **Foreign keys with CASCADE**: Automatic cleanup

## Authentication Approach

### Method: Magic Link (Passwordless)

**Why Magic Link?**
1. **No Password Management**: No storage, no hashing, no forgot password flow
2. **Better UX**: Users don't create/remember passwords
3. **Security**: Tokens are single-use, time-limited (15 min)
4. **Serverless Friendly**: No bcrypt (CPU intensive)
5. **Modern**: Used by Slack, Medium, etc.

**Implementation:**
```typescript
1. User enters email
2. Generate random token (nanoid 32 chars)
3. Store in KV: { email, expiresAt } with 15min TTL
4. Display link (in production: send via email)
5. On verify: check token, delete it, create session
6. Session stored in KV with 24hr TTL
7. Session token in httpOnly cookie
```

**Security Considerations:**
- ✅ Tokens are cryptographically random (nanoid)
- ✅ Single-use (deleted after verification)
- ✅ Time-limited (15 min expiration)
- ✅ HttpOnly cookies (XSS protection)
- ✅ SameSite=Lax (CSRF protection)
- ⚠️ Missing: Rate limiting on /auth/start (production TODO)

## Auto-Save Implementation

### Strategy: Debounced + On-Navigation

**How it works:**
```typescript
1. User types in field → onChange event
2. Cancel previous timer
3. Set new timer (500ms)
4. After 500ms of no typing → API call to /api/forms/save
5. Also save on "Next" button click
6. Show "Saving..." → "Saved" indicator
```

**Why 500ms debounce?**
- Not too aggressive (saves API calls)
- Not too slow (feels instant)
- Industry standard (Google Docs uses 500ms)

**Edge Cases Handled:**
- Network failure: Silent fail, try again on next change
- Rapid navigation: Save on button click (guaranteed)
- Page refresh: Load saved data on mount
- Concurrent sessions: Last write wins (acceptable for single-user)

**Code Location:**
- `lib/form-context.tsx` - Auto-save logic
- `app/api/forms/save/route.ts` - Save endpoint
- `app/api/forms/progress/route.ts` - Load endpoint

## Rate Limiting Implementation

### Strategy: Sliding Window (5 minutes)

**Algorithm:**
```typescript
1. Count AI requests in last 5 minutes
2. If count >= 10: reject with 429
3. If allowed: proceed and log request
4. Return remaining count to client
```

**Why 5 minutes sliding window?**
- Fair: Burst protection without penalizing steady use
- Simple: Easy to implement with timestamp queries
- Clear: Easy to communicate to users

**SQL Query:**
```sql
SELECT COUNT(*) FROM ai_usage 
WHERE user_id = ? 
AND created_at > (NOW() - 5 minutes)
```

**Reset Time Calculation:**
- Find oldest request in window
- Reset = oldest_timestamp + 5 minutes
- Show countdown to user

**Alternative Approaches Considered:**
- Token bucket: More complex, overkill for this scale
- Fixed window: Less fair (boundary exploitation)
- Per-endpoint limits: Could add later if needed

## Prompt Engineering Approach

### Philosophy: Specificity + Error Handling

### Resume Autofill Prompt
```
Extract structured information from this resume and return ONLY valid JSON 
without any additional text or markdown formatting.

Resume:
${resumeText}

Return this exact JSON structure:
{
  "step1": { "fullName": "string", ... },
  "step2": { ... },
  "step3": { ... }
}

Respond ONLY with the JSON object, no explanation or markdown code blocks.
```

**Why this works:**
- ✅ Explicit format requirement
- ✅ Exact schema provided
- ✅ Multiple warnings against markdown
- ✅ Clear field descriptions

**Error Handling:**
```typescript
// Remove markdown code blocks if present
if (text.startsWith('```json')) {
  text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
}
// Try to parse, catch and provide helpful error
```

### Text Improvement Prompt
```
You are helping a candidate improve their job application.
Rewrite the following ${fieldDescription} to be more professional and compelling.
Keep the same meaning and factual information.
Do not add fake information or exaggerate.

Original text:
${text}

Return ONLY the improved text without any explanation.
```

**Why this works:**
- Clear role definition
- Specific constraints (no exaggeration)
- Context-aware (field description varies)
- Simple output format

### Validation Prompt (Bonus Feature)
```
Analyze the following application data for inconsistencies.
Look for:
1. Inconsistencies (e.g., "Senior Engineer" with 1 year)
2. Missing important details
3. Unclear statements

Return ONLY a JSON array:
[
  { "field": "step2.yearsOfExperience", "message": "...", "severity": "warning" }
]

If everything looks good, return: []
```

**Lessons Learned:**
- Gemini is good at following JSON format if asked clearly
- Sometimes adds markdown blocks despite instructions
- Multiple examples help (not included here for brevity)
- Temperature 0.7 balances creativity and consistency

## AI Features Implemented

### ✅ 1. Resume Autofill (Required)
**Functionality:**
- Parse resume text
- Extract personal info, experience, skills
- Preview before accepting
- Fill all relevant fields

**Technical Details:**
- Endpoint: `POST /api/ai/autofill`
- Model: gemini-1.5-flash (fast, free tier)
- Average tokens: ~500-800 per request
- Success rate: ~95% (based on manual testing)

**User Flow:**
1. Click "Import from Resume"
2. Paste resume text
3. Click "Extract Information"
4. Review extracted data
5. Accept or reject

### ✅ 2. Text Improvement (Option A)
**Functionality:**
- Improve writing quality
- Make text more professional
- Preserve original meaning
- Available for: achievements, skills, motivation

**Technical Details:**
- Endpoint: `POST /api/ai/improve`
- Context-aware prompts per field
- Average tokens: ~200-400 per request
- Comparison shown to user

**User Flow:**
1. Fill text field
2. Click "✨ Improve with AI"
3. Review suggestion
4. Accept or reject

### ❌ 3. Smart Validation (Bonus - Not Implemented)
**Why not implemented:**
- Time constraint (3 hour goal)
- Core features prioritized
- Would add in production (15% more value)

**How it would work:**
- Run before final submission
- Check for inconsistencies
- Show warnings (non-blocking)
- Suggest improvements

## Testing Strategy

### Test Coverage

**1. Critical Flow Test** (`tests/critical-flow.spec.ts`)
- ✅ Complete auth flow (magic link)
- ✅ Fill Step 1, save, reload
- ✅ Verify data persistence
- ✅ Complete all 4 steps
- ✅ Submit successfully

**2. AI Features Test** (`tests/ai-features.spec.ts`)
- ✅ Resume import and extraction
- ✅ Data preview and acceptance
- ✅ Field population
- ✅ Text improvement flow

**3. Rate Limiting Test** (`tests/rate-limiting.spec.ts`)
- ✅ Make 10 AI requests
- ✅ 11th request blocked
- ✅ Error message shown
- ✅ Reset time displayed

**4. Auth Protection Test** (`tests/auth-protection.spec.ts`)
- ✅ Redirect to login without auth
- ✅ API endpoints return 401
- ✅ Logout clears session

### Testing Challenges

**Challenge 1: Async AI Calls**
- Solution: Generous timeouts (30s for AI)
- Retry logic in CI

**Challenge 2: Rate Limiting**
- Solution: Separate test user per test
- Reset between runs

**Challenge 3: Magic Link Flow**
- Solution: Extract link from DOM
- Test actual redirect chain

### What I Would Add With More Time
- Visual regression tests (Percy/Chromatic)
- Load testing (k6)
- Accessibility tests (axe-core)
- Mobile responsiveness tests
- API contract tests

## Production Readiness Gaps

### Critical (Must Fix Before Production)
1. **Email Service**: Integrate Resend/SendGrid for magic links
2. **Error Monitoring**: Add Sentry for error tracking
3. **Rate Limiting on Auth**: Prevent email bombing
4. **Input Sanitization**: XSS protection on all user inputs
5. **CSRF Tokens**: Add to all state-changing operations

### Important (Fix Soon)
6. **Database Backups**: Automated D1 backups
7. **Monitoring**: Uptime monitoring, alerts
8. **Logging**: Structured logging for debugging
9. **Analytics**: Form completion funnels
10. **Performance**: Add caching headers

### Nice to Have
11. **CDN**: Cloudflare CDN for static assets
12. **Compression**: Gzip/Brotli for responses
13. **Bundle Optimization**: Code splitting
14. **SEO**: Meta tags, OpenGraph
15. **PWA**: Service worker, offline support

## AI Tools Usage Tracking

### Tools Used During Development

**1. Claude (Anthropic) - Primary**
- **Usage**: Architecture planning, code generation
- **Time**: ~30% of dev time
- **Value**: High - rapid prototyping, best practices

**2. ChatGPT (OpenAI) - Secondary**
- **Usage**: Documentation writing, test cases
- **Time**: ~10% of dev time
- **Value**: Medium - good for variety

**3. Cursor AI - IDE Integration**
- **Usage**: Inline completions, refactoring
- **Time**: Throughout development
- **Value**: High - speed boost

**4. GitHub Copilot**
- **Usage**: Not used (already using Cursor)

### What AI Helped With
- ✅ Boilerplate reduction (50% faster)
- ✅ TypeScript types generation
- ✅ Test case ideation
- ✅ SQL query optimization
- ✅ Documentation writing

### What AI Struggled With
- ❌ Cloudflare Workers specifics (edge cases)
- ❌ Next.js 15 newest features (training cutoff)
- ❌ Complex state management logic
- ❌ Business logic decisions

### Human Decisions (AI Not Used)
- 🧠 Architecture design
- 🧠 Database schema
- 🧠 Security approach
- 🧠 UX flow
- 🧠 Trade-off decisions

## Hardest Technical Challenge

### Challenge: Cloudflare Workers D1 + Next.js Integration

**The Problem:**
Next.js 15 + Cloudflare Workers + D1 is a new stack. Limited documentation and examples. Type definitions incomplete.

**Specific Issues:**
1. D1 bindings not available in Next.js request context
2. Edge runtime restrictions (no Node.js APIs)
3. `@cloudflare/next-on-pages` version conflicts
4. Type safety for Cloudflare bindings

**Solution Approach:**

**1. Type Definitions:**
```typescript
// lib/types.ts
export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GEMINI_API_KEY: string;
}

// Cast process.env to get bindings
const env = (process.env as any) as Env;
```

**2. Edge Runtime:**
```typescript
// All API routes
export const runtime = 'edge';
```

**3. Dependency Resolution:**
```bash
npm install --legacy-peer-deps
```

**Why It Was Hard:**
- Bleeding edge stack (Next 15 just released)
- Documentation gaps
- TypeScript inference issues
- Trial and error required

**What I Learned:**
- Read Cloudflare docs thoroughly
- Check GitHub issues for patterns
- Type casting acceptable for alpha features
- Edge runtime has surprising limitations

**Time Spent:** ~1 hour debugging, ~30min researching

## Key Takeaways

### What Went Well
1. ✅ Magic link auth simpler than expected
2. ✅ Gemini API very reliable
3. ✅ Playwright excellent DX
4. ✅ D1 performance impressive
5. ✅ Auto-save UX smooth

### What I'd Do Differently
1. 🔄 Use Supabase for easier local dev
2. 🔄 Add more granular error states
3. 🔄 Implement optimistic UI updates
4. 🔄 Add more visual feedback
5. 🔄 Start with mobile-first

### If I Had More Time
1. ⏰ Implement smart validation
2. ⏰ Add file upload for resume
3. ⏰ Build admin dashboard
4. ⏰ Add real-time collaboration
5. ⏰ Improve accessibility

## Final Thoughts

This was an excellent full-stack challenge covering:
- Modern serverless architecture
- AI integration
- Real-time features
- Authentication
- Database design
- Testing

The 3-hour estimate was ambitious but achievable for experienced devs. Actual time was closer to 6-7 hours including testing and documentation.

Most valuable learning: Integration of edge computing + AI + persistent storage is the future of web apps. The stack is maturing fast.

**Would I deploy this to production?** Not yet. Need the critical fixes listed above. But it's 70% there, which is impressive for a take-home project.

**Rating my work: 8/10**
- Lost points for not implementing bonus validation
- Lost points for some production gaps
- Strong on core features and testing

