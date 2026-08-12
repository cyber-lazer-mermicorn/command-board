# Deployment Guide — command-board

## Prerequisites

- Node.js 20+
- Vercel account (free tier works)
- All integration accounts from `.env.example`

## Deploy to Vercel

### Option A — One-click (recommended)

Click the button in the README. Vercel will:
1. Fork the repo to your account
2. Prompt you for env vars
3. Deploy automatically

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option C — GitHub Integration

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `cyber-lazer-mermicorn/command-board`
3. Set env vars (see below)
4. Click Deploy

Every push to `main` auto-deploys. PRs get preview deployments.

## Environment Variables (Vercel Dashboard)

Go to **Project Settings → Environment Variables** and add:

| Variable | Where to Get It | Required |
|----------|-----------------|----------|
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain (e.g. `https://command-board.vercel.app`) | ✅ |
| `STYTCH_PROJECT_ID` | [stytch.com/dashboard](https://stytch.com/dashboard) → API Keys | ✅ |
| `STYTCH_SECRET` | Same | ✅ |
| `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` | Same | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (keep secret!) | ✅ |
| `NEON_DATABASE_URL` | [console.neon.tech](https://console.neon.tech) → Connection string | ✅ |
| `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) | ✅ |
| `GITHUB_WEBHOOK_SECRET` | Generate: `openssl rand -hex 32` | ✅ |
| `LINEAR_API_KEY` | [linear.app/settings/api](https://linear.app/settings/api) | ✅ |
| `HUGGINGFACE_API_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | ✅ |
| `CONTEXT7_API_KEY` | [context7.com](https://context7.com) | ✅ |
| `POSTMAN_API_KEY` | [go.postman.co/settings/me/api-keys](https://go.postman.co/settings/me/api-keys) | ✅ |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | ✅ |

## Post-Deploy Steps

### 1. Configure Stytch Redirect URLs

In [Stytch dashboard](https://stytch.com/dashboard) → **Redirect URLs**, add:
- `https://your-domain.vercel.app/auth/callback`

For local dev, also add:
- `http://localhost:3000/auth/callback`

### 2. Register GitHub Webhook

Go to [github.com/cyber-lazer-mermicorn/mermicorn-grove/settings/hooks](https://github.com/cyber-lazer-mermicorn/mermicorn-grove/settings/hooks) and add:

- **Payload URL**: `https://your-domain.vercel.app/api/github/webhook`
- **Content type**: `application/json`
- **Secret**: your `GITHUB_WEBHOOK_SECRET` value
- **Events**: Push, Pull requests, Workflow runs, Deployments

Repeat for any other constellation repos you want to stream into the dashboard.

### 3. Initialize Supabase Schema

1. Open [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Paste contents of `supabase/schema.sql`
5. Click **Run**

### 4. Verify Deployment

```bash
curl https://your-domain.vercel.app/health
```

You should see:
```json
{
  "status": "ok",
  "service": "command-board",
  "integrations": {
    "github": true,
    "linear": true,
    ...
  }
}
```

All values should be `true`. Any `false` means that env var is missing.

## Cron Jobs

Vercel runs the constellation health check hourly:
- **Route**: `/api/cron/constellation-check`
- **Schedule**: `0 * * * *` (every hour)
- **Auth**: `CRON_SECRET` header

This checks every constellation repo for its `mermicorn.repo.yaml` manifest and writes results to Supabase.

## Preview Deployments

Every PR automatically gets a preview URL like:
`https://command-board-git-feature-xyz-mermicorn.vercel.app`

Use these to test changes before merging to `main`.
