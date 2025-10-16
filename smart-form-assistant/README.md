# Smart Form Assistant

An AI-powered job application form system with intelligent auto-fill, text improvement, and auto-save capabilities. Built with Next.js 15, React 19, TypeScript, and deployed on Cloudflare Workers.

## 🚀 Features

- **Magic Link Authentication**: Passwordless authentication system
- **Multi-Step Form**: 4-step job application form with validation
- **Auto-Save & Resume**: Automatically saves progress and allows users to resume
- **AI Auto-Fill**: Extract information from resume using Google Gemini API
- **AI Text Improvement**: Enhance text quality for achievements, skills, and motivation
- **Rate Limiting**: 10 AI requests per 5-minute window per user
- **Real-time Validation**: Client and server-side validation with Zod
- **Persistent Storage**: Cloudflare D1 (SQLite) for data and KV for sessions
- **Comprehensive Testing**: E2E tests with Playwright

## 📋 Architecture Overview

### Authentication Flow
1. User enters email
2. System generates magic link token (stored in KV)
3. Token displayed in UI (in production, sent via email)
4. User clicks link → session created → redirected to form

### Database Design

**Technology Stack:**
- **D1 (SQLite)**: Primary data storage
- **KV**: Session management (fast, TTL-based)

**Schema:**
```sql
users (id, email, created_at)
form_progress (id, user_id, form_data, current_step, updated_at)
form_submissions (id, user_id, form_data, submitted_at)
ai_usage (id, user_id, endpoint, tokens_used, cost_estimate, created_at)
rate_limits (id, user_id, window_start, request_count)
```

### API Endpoints

**Authentication:**
- `POST /api/auth/start` - Generate magic link
- `GET /api/auth/verify` - Verify token and create session
- `GET /api/auth/session` - Check current session
- `POST /api/auth/logout` - Logout and clear session

**Forms:**
- `GET /api/forms/progress` - Get saved progress
- `POST /api/forms/save` - Save form progress (auto-save)
- `POST /api/forms/submit` - Submit completed form
- `GET /api/forms/submissions` - Get user's past submissions

**AI Features:**
- `POST /api/ai/autofill` - Extract data from resume
- `POST /api/ai/improve` - Improve text quality
- `POST /api/ai/validate` - Validate form for inconsistencies (bonus)
- `GET /api/ai/usage` - Get remaining AI requests

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)
- Google Gemini API key (free tier)

### Local Development

1. **Clone and Install:**
```bash
cd smart-form-assistant
npm install
```

2. **Get Gemini API Key:**
   - Visit https://ai.google.dev/
   - Create a new API key
   - Copy the key

3. **Setup Environment Variables:**
```bash
# Create .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

4. **Run Development Server:**
```bash
npm run dev
```

Visit http://localhost:3000

### Database Setup (Cloudflare)

1. **Create D1 Database:**
```bash
npm run db:create
# Copy the database_id from output and update wrangler.toml
```

2. **Run Migrations:**
```bash
npm run db:migrate
```

3. **Create KV Namespace:**
```bash
npm run kv:create
# Copy the id from output and update wrangler.toml
```

### Deployment to Cloudflare Workers

1. **Login to Cloudflare:**
```bash
npx wrangler login
```

2. **Set Secrets:**
```bash
npx wrangler secret put GEMINI_API_KEY
# Enter your API key when prompted
```

3. **Build and Deploy:**
```bash
npm run build
npm run pages:build
npm run pages:deploy
```

4. **Access Your App:**
```
https://smart-form-assistant.pages.dev
```

## 🧪 Testing

### Run E2E Tests:
```bash
npm run test
```

### Run Tests with UI:
```bash
npm run test:ui
```

### Test Coverage:
- ✅ Authentication flow (magic link)
- ✅ Form auto-save and resume
- ✅ AI autofill from resume
- ✅ AI text improvement
- ✅ Rate limiting (10 requests/5min)
- ✅ Auth protection on endpoints

## 🎯 Technical Decisions & Trade-offs

### 1. Database Choice: D1 + KV
**Why:**
- D1 is native to Cloudflare Workers (low latency)
- Free tier sufficient for project scale
- KV perfect for sessions (TTL, fast access)
- SQLite schema is simple and portable

**Trade-off:**
- D1 has some limitations vs full Postgres
- But for this use case, it's ideal

### 2. Authentication: Magic Link
**Why:**
- No password management complexity
- Better UX (no forgotten passwords)
- Easy to implement in serverless

**Trade-off:**
- Can't send emails from Workers (displayed link instead)
- In production would need email service integration

### 3. Auto-Save Approach
**Implementation:**
- Debounced saves (500ms delay)
- Save on step navigation
- Load on page mount

**Why:**
- Reduces API calls (cost optimization)
- Better UX (no waiting)
- Handles network issues gracefully

### 4. Rate Limiting Strategy
**Implementation:**
- Track AI requests in D1
- Count requests in 5-minute sliding window
- Check before each AI call

**Why:**
- Prevents API abuse
- Simple to implement
- Fair usage enforcement

### 5. Prompt Engineering
**Approach:**
- Request JSON-only responses
- Provide exact schema
- Handle markdown code blocks in parsing

**Why:**
- Reliable parsing
- Type-safe extraction
- Error handling for malformed responses

## 📊 Production Gaps & Improvements

### High Priority
1. **Email Integration**: Use service like Resend/SendGrid for magic links
2. **Error Monitoring**: Add Sentry or similar
3. **Analytics**: Track form completion rates
4. **CSRF Protection**: Add tokens for form submissions
5. **Input Sanitization**: XSS prevention on user inputs

### Medium Priority
6. **File Upload**: Allow resume file upload (PDF parsing)
7. **Multi-language**: i18n support
8. **Accessibility**: ARIA labels, keyboard navigation
9. **Progressive Enhancement**: Work without JS
10. **Caching**: Add response caching for static data

### Nice to Have
11. **Real-time Collaboration**: Multiple tabs sync
12. **Draft Management**: Save multiple draft applications
13. **Admin Dashboard**: View submissions
14. **Export**: PDF generation of submissions
15. **A/B Testing**: Form optimization

## 🏗️ Project Structure

```
smart-form-assistant/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── forms/        # Form management
│   │   └── ai/           # AI features
│   ├── form/             # Main form page
│   ├── login/            # Login page
│   └── page.tsx          # Root redirect
├── components/           # React components
│   ├── Step1Personal.tsx
│   ├── Step2Experience.tsx
│   ├── Step3Skills.tsx
│   ├── Step4Motivation.tsx
│   ├── ReviewPage.tsx
│   ├── ResumeImport.tsx
│   ├── AIImprove.tsx
│   ├── StepIndicator.tsx
│   ├── FormNavigation.tsx
│   └── SaveIndicator.tsx
├── lib/                  # Utilities & logic
│   ├── types.ts          # TypeScript types
│   ├── schemas.ts        # Zod validation schemas
│   ├── db.ts             # Database operations
│   ├── session.ts        # Session management
│   ├── auth.ts           # Auth helpers
│   ├── gemini.ts         # Gemini API client
│   ├── cloudflare.ts     # CF bindings helper
│   └── form-context.tsx  # Form state management
├── tests/                # Playwright E2E tests
├── schema.sql            # Database schema
├── wrangler.toml         # Cloudflare config
├── next.config.ts        # Next.js config
└── playwright.config.ts  # Test config
```

## 📝 License

This project was created as a technical assessment. All rights reserved.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Cloudflare for Workers platform
- Google for Gemini API
- Vercel for deployment tooling
