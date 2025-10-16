# Deployment Guide

Complete guide for deploying Smart Form Assistant to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Wrangler CLI**: Installed via npm (already in package.json)
3. **Gemini API Key**: Get from https://ai.google.dev/

## Step-by-Step Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window for authentication.

### 2. Create D1 Database

```bash
npm run db:create
```

Output will show:
```
✅ Successfully created DB 'forms_db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`** and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "forms_db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace this
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This executes the `schema.sql` file to create tables.

Verify with:
```bash
npx wrangler d1 execute forms_db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output:
```
users
form_progress
form_submissions
ai_usage
rate_limits
```

### 4. Create KV Namespace

```bash
npm run kv:create
```

Or directly:
```bash
wrangler kv namespace create SESSIONS
```

Output will show:
```
🌀 Creating namespace with title "smart-form-assistant-SESSIONS"
✨ Success!
Add the following to your configuration file:
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Copy the `id`** and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_KV_ID_HERE"  # Replace this
```

### 5. Set Environment Secrets

For Pages projects, you need to set secrets via the Cloudflare Dashboard:

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to **Workers & Pages** > **Your Pages Project** > **Settings** > **Environment variables**
3. Click **Add variables**
4. Add variable:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Production (and Preview if needed)
5. Click **Save**

Alternatively, use Wrangler CLI (requires project name):
```bash
npx wrangler pages secret put GEMINI_API_KEY --project-name=smart-form-assistant
```

When prompted, paste your Gemini API key.

### 6. Build the Application

```bash
npm run build
```

This runs Next.js build with optimizations.

### 7. Build for Cloudflare Pages

```bash
npm run pages:build
```

This uses `@cloudflare/next-on-pages` to create a Workers-compatible build in `.vercel/output/static`.

### 8. Deploy to Cloudflare

#### Option A: Deploy via Git (Recommended)

1. Push your code to GitHub/GitLab
2. Go to Cloudflare Dashboard > Workers & Pages
3. Click "Create application" > "Pages" > "Connect to Git"
4. Select your repository
5. Configure build settings:

**Build configuration:**
```
Production branch: main
Root directory (advanced): smart-form-assistant
Build command: npm install && npm run build && npm run pages:build
Build output directory: .vercel/output/static
```

**Environment variables (Build settings):**
- **Node.js version**: `18` or `20`
  (Add environment variable: `NODE_VERSION` = `20`)

6. Click "Save and Deploy"

**Note:** Don't forget to add `GEMINI_API_KEY` in Settings > Environment variables after first deployment.

#### Option B: Manual Deploy via CLI

```bash
npm run pages:deploy
```

Or deploy manually:
```bash
npx wrangler pages deploy .vercel/output/static --project-name=smart-form-assistant
```

### 9. Configure Custom Domain (Optional)

In Cloudflare Dashboard:
1. Go to Pages project
2. Click "Custom domains"
3. Add your domain
4. Update DNS records as instructed

## Verify Deployment

### 1. Check Database

```bash
npx wrangler d1 execute forms_db --command "SELECT COUNT(*) FROM users;"
```

Should return `0` initially.

### 2. Test Endpoints

Visit your deployed URL and test:
- Login page loads
- Magic link generation works
- Form navigation works
- Auto-save functionality
- AI features respond

### 3. Check Logs

```bash
npx wrangler pages deployment tail
```

Or in Cloudflare Dashboard:
- Pages > Your Project > Deployment > Logs

## Local Development with Cloudflare

### Option 1: Local Next.js Dev Server

```bash
npm run dev
```

**Note:** This won't have actual D1/KV bindings. Use for UI development only.

### Option 2: Wrangler Dev Server

```bash
# First, build for Pages
npm run build
npm run pages:build

# Then run with Wrangler
npm run pages:dev
```

This runs with actual D1/KV bindings locally.

### Local Database Setup

For local development, create a local D1 database:

```bash
# Create local DB
npx wrangler d1 create forms_db --local

# Run migrations locally
npx wrangler d1 execute forms_db --local --file=./schema.sql

# Test local DB
npx wrangler d1 execute forms_db --local --command "SELECT * FROM users;"
```

## Environment Variables

### Production (Cloudflare)

Set via Cloudflare Dashboard:
- Workers & Pages > Your Pages > Settings > Environment variables

Or via Wrangler CLI:
```bash
npx wrangler pages secret put GEMINI_API_KEY --project-name=smart-form-assistant
```

### Local Development

Create `.dev.vars` file (git-ignored):
```bash
GEMINI_API_KEY=your_key_here
```

## Troubleshooting

### Issue: "Database not found"

**Solution:**
Verify `wrangler.toml` has correct `database_id`:
```bash
npx wrangler d1 list
```

### Issue: "KV namespace not found"

**Solution:**
Verify `wrangler.toml` has correct KV `id`:
```bash
npx wrangler kv:namespace list
```

### Issue: "Gemini API key not working"

**Solution:**
Verify secret is set in Cloudflare Dashboard:
- Workers & Pages > Your Pages > Settings > Environment variables

Or list secrets via CLI:
```bash
npx wrangler pages secret list --project-name=smart-form-assistant
```

Should show `GEMINI_API_KEY`. If not, set it:
```bash
npx wrangler pages secret put GEMINI_API_KEY --project-name=smart-form-assistant
```

### Issue: Build fails with module errors

**Solution:**
Clear cache and rebuild:
```bash
rm -rf .next node_modules .vercel
npm install
npm run build
npm run pages:build
```

### Issue: Pages deployment fails

**Solution:**
Check compatibility date in `wrangler.toml`:
```toml
compatibility_date = "2024-01-01"  # Should be recent
```

### Issue: Edge runtime errors

**Solution:**
Ensure all API routes have:
```typescript
export const runtime = 'edge';
```

## Performance Optimization

### 1. Enable Caching

Add cache headers in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60' }
      ],
    },
  ];
}
```

### 2. Enable Compression

Cloudflare automatically compresses responses. No config needed.

### 3. Monitor Performance

In Cloudflare Dashboard:
- Analytics > Web Analytics
- Workers & Pages > Analytics

## Scaling Considerations

### Free Tier Limits

**D1:**
- 5 GB storage
- 5M reads/day
- 100K writes/day

**KV:**
- 100K reads/day
- 1K writes/day
- 1 GB storage

**Workers:**
- 100K requests/day

### When to Upgrade

Upgrade to paid plan when:
- Users > 10,000/day
- Submissions > 5,000/day
- Need higher rate limits

## Monitoring & Alerts

### Set Up Alerts

In Cloudflare Dashboard:
1. Account Home > Notifications
2. Add Notification:
   - Worker error rate > 5%
   - Pages deployment failed
   - Database errors

### Health Check Endpoint

Create `/api/health/route.ts`:
```typescript
export const runtime = 'edge';

export async function GET() {
  return Response.json({ status: 'ok', timestamp: Date.now() });
}
```

Monitor at: `https://your-app.pages.dev/api/health`

## Rollback Procedure

### Rollback to Previous Deployment

```bash
npx wrangler pages deployment list
npx wrangler pages deployment rollback --deployment-id=DEPLOYMENT_ID
```

Or in Dashboard:
- Pages > Deployments > Previous deployment > Rollback

### Database Rollback

**Important:** D1 doesn't support automatic rollback.

**Manual process:**
1. Export current data
2. Restore from backup
3. Re-run migrations if needed

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: |
          npm run build
          npm run pages:build
      
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy .vercel/output/static --project-name=smart-form-assistant
```

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations ran successfully
- [ ] KV namespace created and bound
- [ ] Test authentication flow
- [ ] Test form submission flow
- [ ] Test AI features
- [ ] Verify rate limiting
- [ ] Check error logs
- [ ] Set up monitoring alerts
- [ ] Configure custom domain (optional)
- [ ] Update DNS records (if custom domain)
- [ ] Test from multiple locations
- [ ] Run E2E tests against production

## Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Next.js on Pages**: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community**: https://discord.cloudflare.com/

## Cost Estimates

### Free Tier (Current Setup)
- **Cost**: $0/month
- **Capacity**: 
  - ~10,000 users/day
  - ~5,000 forms/day
  - ~50,000 AI requests/day (rate limited per user)

### Paid Plan (If Needed)
- **Workers Paid**: $5/month
- **D1**: Pay-as-you-go (minimal cost)
- **KV**: Pay-as-you-go (minimal cost)
- **Estimated**: $10-20/month for 100K users

## Security Checklist

- [ ] API keys in secrets (not code)
- [ ] HttpOnly cookies enabled
- [ ] CSRF protection considered
- [ ] Rate limiting on auth endpoints (TODO)
- [ ] Input sanitization implemented (TODO)
- [ ] SQL injection prevented (parameterized queries ✓)
- [ ] XSS prevention (React escaping ✓)
- [ ] CORS configured properly
- [ ] HTTPS only (Cloudflare enforces ✓)

## Next Steps After Deployment

1. **Monitor for 24 hours**: Watch for errors
2. **Test with real users**: Get feedback
3. **Iterate on UI/UX**: Based on user feedback
4. **Add missing features**: See QUESTIONNAIRE.md
5. **Optimize performance**: Check Web Vitals
6. **Marketing**: Share your deployed app!

---

**Deployment Date**: _______
**Deployed By**: _______
**Production URL**: _______
**Version**: 1.0.0

