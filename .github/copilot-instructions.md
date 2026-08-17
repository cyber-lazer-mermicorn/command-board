# command-board — Copilot & Agent Instructions

## What This Is
Mermicorn Command Board — unified control plane dashboard.
Integrates: GitHub · Linear · Supabase · Vercel · Hugging Face · Context7 · Stytch · Neon · Postman.
This is the NERVE CENTER of the Mermicorn Grove — production-grade, zero tolerance for broken integrations.

## Tech Stack
- **Framework**: Next.js (App Router) + TypeScript strict mode
- **Auth**: Stytch
- **Primary DB**: Supabase (relational data, provider configs)
- **Edge DB**: Neon (read replicas, branching for staging)
- **Error Monitoring**: Sentry (`@sentry/nextjs`)
- **Deploy**: Vercel
- **Context**: Context7 MCP for live documentation injection

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEON_DATABASE_URL=
STYTCH_PROJECT_ID=
STYTCH_SECRET=
SENTRY_DSN=https://a23d69ceea4df963fbc24baf6dc22c2c@o4511894970236928.ingest.us.sentry.io/4511926166618112
NEXT_PUBLIC_SENTRY_DSN=https://a23d69ceea4df963fbc24baf6dc22c2c@o4511894970236928.ingest.us.sentry.io/4511926166618112
VERCEL_ENV=production
```

## Hard Rules
1. **Supabase = source of truth for provider configs and user data** — Neon is for edge reads only
2. **All provider API keys stored in Supabase** — never hardcoded, never in client bundle
3. **All errors must go to Sentry** — dashboard errors are silent killers; instrument everything
4. **No `any` types** — TypeScript strict mode on
5. **Stytch handles ALL auth** — no custom auth logic, no rolling your own sessions
6. **Each provider integration lives in `/lib/providers/[name].ts`** — one file per integration

## Project Structure
```
/src
  /app
    /dashboard        # Main command board UI
    /api
      /providers      # Provider webhook/status endpoints
      /health         # Health check endpoints
  /components
    /providers        # Per-provider status cards
    /dashboard        # Layout, nav, command palette
  /lib
    supabase.ts       # Singleton Supabase client
    neon.ts           # Neon edge client
    sentry.ts         # Sentry init
    stytch.ts         # Stytch auth client
    /providers        # One file per integration (github.ts, stripe.ts, etc.)
  /types
/postman              # API collection exports
```

## Sentry Setup (required)
```ts
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 1.0,
});
```

## Supabase vs Neon Rule
```ts
// CORRECT: Supabase for writes and auth-dependent reads
const { data } = await supabase.from('providers').select('*').eq('user_id', userId);

// CORRECT: Neon for public/edge reads (no auth dependency)
const result = await neon`SELECT * FROM public_status WHERE active = true`;

// WRONG: Never use Neon for user-scoped data writes
```

## What NOT to Do
- Do not add provider integrations directly in page components — use `/lib/providers/`
- Do not expose provider API keys to the client bundle
- Do not use `console.log` — use Sentry breadcrumbs
- Do not create a new Supabase or Neon client per request
- Do not skip error states in provider status cards — show degraded/error UI explicitly

## Org-wide Rules
Also see: [cyber-lazer-mermicorn/.github/copilot-instructions.md](https://github.com/cyber-lazer-mermicorn/cyber-lazer-mermicorn/blob/main/.github/copilot-instructions.md)
