# Status — command-board

| Field | Value |
|-------|-------|
| **Status** | Active build — dashboard gated + live constellation panel |
| **Last Updated** | 2026-08-31 |
| **Phase** | Foundation + first live panels |

## What is real in the repo today

| Area | Present |
|------|--------|
| Next.js App Router | Yes |
| Dashboard route | Yes (`app/dashboard/page.tsx`) |
| Dashboard gate | Yes (`middleware.ts` + `/login` when `COMMAND_BOARD_ACCESS_TOKEN` set) |
| Constellation API | Yes (`GET /api/constellation`) — live manifest checks |
| Constellation panel | Live client fetch |
| Deployments API | Soft env (`GET /api/deployments`) |
| CI panel | Live client fetch (needs `VERCEL_TOKEN`) |
| Health / webhook / cron / agent routes | Yes |
| Stytch full passwordless | Not complete — token gate is interim |

## Build layers (honest)

### Layer 1 — Foundation
- [x] Next.js App Router project structure
- [x] Core API routes (health, github webhook, deployments, cron, constellation)
- [x] Dashboard page shell
- [x] Interim dashboard protection (`COMMAND_BOARD_ACCESS_TOKEN`)
- [ ] Stytch passwordless auth fully wired end-to-end
- [ ] Supabase `mermicorn-core` schema fully applied in production
- [ ] Neon edge Postgres connection verified in prod
- [ ] Production env complete on Vercel

### Layer 2 — Integrations
- [x] GitHub webhook receiver route
- [x] Constellation live panel (public YAML check)
- [x] Deployments live panel (when Vercel token set)
- [ ] Linear API integration complete
- [ ] Postman collection runner in UI

### Layer 3 — Intelligence
- [x] Agent route surfaces (oracle / pricing / sentinel)
- [ ] Hugging Face Inference fully productized in panels
- [ ] Context7 doc lookup
- [ ] ai-observability telemetry feed

## Priority next (code)

1. Wire Stytch and retire token gate when ready.
2. Harden `/api/health` so it soft-fails missing optional services.
3. GitHub Actions feed on CI panel.

See [README.md](README.md) for stack and quick start.
