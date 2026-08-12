# 🧭 Mermicorn Command Board

> **Control plane for the Cyber Lazer Mermicorn constellation.**
> One dashboard. Every system. No tab-hopping.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cyber-lazer-mermicorn/command-board)

---

## What This Is

The Command Board is a Next.js app deployed on Vercel that wires together every tool in the Mermicorn stack into a single operational surface:

| Panel | Source |
|-------|--------|
| 🌿 Constellation Health | GitHub API → mermicorn-grove validator |
| 📋 Linear Status | Linear API → issue counts by vertical |
| 🚀 CI / Deployments | GitHub Actions + Vercel webhooks |
| 🧠 AI Observability | Hugging Face + ai-observability repo |
| ⚡ Quick Actions | Trigger workflows, create issues, run Postman |

## Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Hosting | Vercel |
| Auth | Stytch (passwordless) |
| Primary DB | Supabase (mermicorn-core schema) |
| Edge DB | Neon (serverless Postgres) |
| AI Models | Hugging Face Inference API |
| Doc Lookup | Context7 |
| API Testing | Postman Collections |
| Project Tracking | Linear |
| Source of Truth | GitHub |

## Repo Structure

```
command-board/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── page.tsx        # Main command board
│   │   ├── constellation/  # Grove health panel
│   │   ├── linear/         # Linear status panel
│   │   ├── ci/             # CI & deployments panel
│   │   ├── observability/  # AI observability panel
│   │   └── actions/        # Quick actions panel
│   ├── api/                # API routes
│   │   ├── github/         # GitHub webhook receiver
│   │   ├── linear/         # Linear API proxy
│   │   ├── supabase/       # Supabase helpers
│   │   └── health/         # System health check
│   └── auth/               # Stytch auth pages
├── components/             # Reusable UI components
│   ├── panels/             # Dashboard panel components
│   ├── ui/                 # Base UI primitives
│   └── layout/             # Layout components
├── lib/                    # Integration clients
│   ├── github.ts           # GitHub API client
│   ├── linear.ts           # Linear API client
│   ├── supabase.ts         # Supabase client
│   ├── neon.ts             # Neon edge client
│   ├── stytch.ts           # Stytch auth client
│   ├── huggingface.ts      # HF Inference client
│   └── postman.ts          # Postman API client
├── hooks/                  # React hooks
├── types/                  # TypeScript types
├── postman/                # Postman collections
├── supabase/               # DB migrations & schema
├── .env.example            # All required env vars
└── mermicorn.repo.yaml     # Constellation manifest
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/cyber-lazer-mermicorn/command-board
cd command-board

# 2. Install
npm install

# 3. Configure env
cp .env.example .env.local
# Fill in your keys (see .env.example)

# 4. Run
npm run dev
# → http://localhost:3000
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. All variables are required for production.

## Deployment

1. Push to `main` → Vercel auto-deploys
2. Set all env vars in Vercel dashboard
3. Configure Stytch redirect URLs to your Vercel domain
4. Register GitHub webhook → `https://your-domain.vercel.app/api/github/webhook`

## Status

See [STATUS.md](STATUS.md) for current build progress.

---

*Part of the [Mermicorn Grove](https://github.com/cyber-lazer-mermicorn/mermicorn-grove) constellation.*
*© Cherry. All rights reserved.*
