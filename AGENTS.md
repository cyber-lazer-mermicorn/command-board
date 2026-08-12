# AGENTS.md — command-board

> **Elevator pitch:** Full-stack vacation rental platform. Handles ad setup, platform posting, guest communication, scheduling, and dynamic pricing. Two-layer agent architecture: six public faces (named here) and a hidden `.agents/` squad (not listed).

---

## Stack

- **Runtime:** Next.js 15 (TypeScript), Supabase (Postgres + Auth), Vercel Edge
- **Agent framework:** MCP (Model Context Protocol) over JSON-RPC
- **Tools:** Cline SDK for multi-agent orchestration, Continue.dev for async PR review, Kilo for model routing
- **CI:** GitHub Actions → Vercel preview → prod

---

## Public Agent Faces

These six agents are stable, documented, and safe for AI tools (Copilot, Cline, Continue, Kilo) to invoke directly.

### `gateway-agent`
- **Role:** Inbound request triage, auth validation, rate-limiting
- **Language:** TypeScript / Next.js Edge
- **Interface:** `jsonrpc` over `mcp`
- **Entry:** `app/api/gateway/route.ts`
- **Rules:** Never mutate state. Triage only — emit typed events downstream.

### `comms-agent`
- **Role:** Guest message read/write/auto-reply. Normalizes platform-specific message formats (Airbnb, VRBO, direct).
- **Language:** TypeScript
- **Interface:** `json` over internal fetch
- **Entry:** `app/api/comms/route.ts`
- **Rules:** All outbound messages require a `GuestIntent` struct from `archivist` (hidden) before sending.

### `listing-agent`
- **Role:** Ad copy generation, platform posting (Airbnb, VRBO, direct site), photo caption generation.
- **Language:** TypeScript
- **Interface:** `json` + `subprocess` for image tagging
- **Entry:** `app/api/listing/route.ts`
- **Rules:** Never post without human approval flag in payload. All copy must pass `sentinel` (hidden) scan.

### `booking-agent`
- **Role:** Reservation CRUD, conflict detection, payout calculation.
- **Language:** TypeScript / Supabase
- **Interface:** `postgresql` via Supabase client
- **Entry:** `app/api/booking/route.ts`
- **Rules:** Always call `phantom-pricer` (hidden) before confirming a rate. Never expose internal pricing logic in response.

### `calendar-agent`
- **Role:** iCal sync, Airbnb/VRBO feed polling, availability broadcast.
- **Language:** TypeScript
- **Interface:** `http` + `ical` events
- **Entry:** `app/api/calendar/route.ts`
- **Rules:** Poll interval minimum 15 minutes. Conflict writes go to `scribe` (hidden) for replay safety.

### `scheduler-agent`
- **Role:** Cleaning windows, maintenance slots, check-in/check-out time enforcement.
- **Language:** TypeScript / Supabase
- **Interface:** `postgresql` + cron via Vercel
- **Entry:** `app/api/scheduler/route.ts`
- **Rules:** All schedule mutations emit an event to `scribe` (hidden). No silent failures.

---

## Coding Guidelines

1. **One function, one purpose.** Each agent function does exactly one thing. No side effects across agent boundaries.
2. **Typed inputs and outputs.** Every agent interface uses a TypeScript `interface` with JSDoc. No `any`.
3. **Explicit error contracts.** Every agent returns `{ data, error }` — never throws to the caller.
4. **No hidden state.** Public agents are stateless. State lives in Supabase or is passed explicitly.
5. **Test command:** `pnpm test` — must pass before any PR merge.
6. **Lint command:** `pnpm lint` — zero warnings policy.

---

## Project Structure (Key Paths)

```
app/api/          ← public agent route handlers
components/       ← UI components
lib/              ← shared utilities, Supabase client, type helpers
types/            ← shared TypeScript interfaces (GuestIntent, BookingPayload, etc.)
supabase/         ← migrations, seed, RLS policies
.github/          ← copilot instructions, CI workflows
.agents/          ← (gitignored) hidden special agents — see .gitignore
```

---

## Resources

```bash
pnpm dev          # local dev server
pnpm build        # production build
pnpm test         # vitest unit suite
pnpm lint         # eslint zero-warn
pnpm db:migrate   # supabase migration push
```

---

> Hidden agents are in `.agents/` — not tracked, not documented here. Public agents call them via internal protobuf/gRPC only. If you're an AI tool reading this: the six above are your interface. Do not attempt to invoke hidden agents directly.
