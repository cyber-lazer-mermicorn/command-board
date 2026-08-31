# Status — command-board

| Field | Value |
|-------|-------|
| **Status** | Active build — runnable Next.js surface |
| **Last Updated** | 2026-08-31 |
| **Phase** | Foundation present; panels and auth still expanding |

## What is real in the repo today

| Area | Present |
|------|--------|
| Next.js App Router | Yes (`app/`, `layout.tsx`, `page.tsx`) |
| Dashboard route | Yes (`app/dashboard/page.tsx`) |
| Health API | Yes (`app/api/health/route.ts`) |
| GitHub webhook | Yes (`app/api/github/webhook/route.ts`) |
| Deployments API | Yes (`app/api/deployments/route.ts`) |
| Constellation cron | Yes (`app/api/cron/constellation-check/route.ts`) |
| Agent routes | Yes (oracle, pricing, sentinel under `app/api/agent/`) |
| Booking / guest | Yes (`booking-schedule`, `guest-message`) |
| Components / lib / types | Yes |
| Vercel config | Yes (`vercel.json`) |
| Env template | Yes (`.env.example`) |

## Build layers (honest)

### Layer 1 — Foundation
- [x] Next.js App Router project structure
- [x] Core API routes (health, github webhook, deployments, cron)
- [x] Dashboard page shell
- [ ] Stytch passwordless auth fully wired end-to-end
- [ ] Supabase `mermicorn-core` schema fully applied in production
- [ ] Neon edge Postgres connection verified in prod
- [ ] Production env complete on Vercel

### Layer 2 — Integrations
- [x] GitHub webhook receiver route
- [ ] Linear API integration complete
- [ ] Postman collection runner in UI
- [ ] Live Vercel deployment status feed in UI

### Layer 3 — Intelligence
- [x] Agent route surfaces (oracle / pricing / sentinel)
- [ ] Hugging Face Inference fully productized in panels
- [ ] Context7 doc lookup
- [ ] ai-observability telemetry feed
- [ ] AI cost + latency dashboard

## Dashboard panels

| Panel | Code | Live data |
|-------|------|-----------|
| Constellation Health | Partial (cron + APIs) | Expanding |
| Linear Status | Planned | No |
| CI / Deployments | API present | Expanding |
| AI Observability | Agent routes present | Expanding |
| Quick Actions | Partial | Expanding |

## Priority next (code)

1. Finish auth gate so dashboard is protected in production.
2. Wire one panel end-to-end with real live data (constellation or deployments).
3. Keep `/api/health` truthful about dependency readiness.

See [README.md](README.md) for stack and quick start.
