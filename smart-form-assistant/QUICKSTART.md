# Quick Start Guide

Get up and running with Smart Form Assistant in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Terminal/Command Line

## Installation

```bash
# 1. Navigate to project
cd smart-form-assistant

# 2. Install dependencies
npm install

# 3. Get Gemini API Key
# Visit: https://ai.google.dev/
# Click "Get API Key" → Create new key
# Copy the key

# 4. Create environment file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env.local

# Replace 'your_actual_api_key_here' with your real key
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test the Application

### 1. Login
- Enter any email address
- Click "Send Magic Link"
- Click the displayed magic link

### 2. Fill Form Manually
- Complete Step 1 (Personal Info)
- Click "Next" - notice "Saved" indicator
- Continue through Steps 2-4
- Click "Review & Submit"
- Submit the form

### 3. Test AI Auto-Fill
- Start a new application (refresh page)
- Click "Import from Resume"
- Paste this sample resume:

```
John Doe
john.doe@email.com | +1-555-0123 | San Francisco, CA

EXPERIENCE
Senior Software Engineer at TechCorp (2020-Present)
• Led development of microservices architecture serving 10 million users
• Reduced API latency by 60% through optimization
• Mentored team of 5 junior engineers

SKILLS
Languages: TypeScript, Python, Go, SQL
Frameworks: React, Next.js, FastAPI, PostgreSQL
Tools: Docker, Kubernetes, AWS
```

- Click "Extract Information"
- Review extracted data
- Click "Accept & Fill Form"

### 4. Test AI Text Improvement
- Go to Step 2 (Work Experience)
- Type: "I worked on projects and helped the team"
- Click "✨ Improve with AI"
- See improved version
- Accept or reject

### 5. Test Auto-Save
- Fill some fields
- Wait for "Saved" indicator
- Refresh the page
- See your data restored

## Run Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm run test

# Run tests with UI
npm run test:ui
```

## Common Issues

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### "Gemini API error"
Check that your API key is correct in `.env.local`

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Project Structure

```
smart-form-assistant/
├── app/                    # Next.js pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── auth/         # Authentication
│   │   ├── forms/        # Form management
│   │   └── ai/           # AI features
│   ├── form/             # Main form page
│   └── login/            # Login page
├── components/           # React components
├── lib/                  # Utilities and business logic
├── tests/                # E2E tests
└── schema.sql           # Database schema
```

## Key Features

✅ **Magic Link Authentication** - No passwords needed
✅ **Multi-Step Form** - 4 steps with validation
✅ **Auto-Save** - Never lose your progress
✅ **AI Resume Parser** - Extract info automatically
✅ **AI Text Improver** - Make your answers shine
✅ **Rate Limiting** - 10 AI requests per 5 minutes
✅ **Fully Tested** - E2E tests with Playwright

## Next Steps

1. **Read Full Documentation**: See [README.md](./README.md)
2. **Deploy to Production**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Understand Architecture**: See [SCHEMA.md](./SCHEMA.md)
4. **Review Decisions**: See [QUESTIONNAIRE.md](./QUESTIONNAIRE.md)

## Need Help?

- Check the [README.md](./README.md) for detailed information
- Review [QUESTIONNAIRE.md](./QUESTIONNAIRE.md) for technical decisions
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run test             # Run tests

# Database (Cloudflare)
npm run db:create        # Create D1 database
npm run db:migrate       # Run migrations
npm run kv:create        # Create KV namespace

# Deployment (Cloudflare)
npm run pages:build      # Build for Workers
npm run pages:deploy     # Deploy to Cloudflare
```

---

**Time to first run:** ~5 minutes
**Time to full deployment:** ~15 minutes

Enjoy building with Smart Form Assistant! 🚀

