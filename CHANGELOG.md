# Changelog — command-board

## [0.1.0] — 2026-08-11

### Added
- Initial scaffold: Next.js 14, Tailwind, TypeScript
- Five dashboard panels: Constellation Health, Linear Status, CI/Deployments, AI Observability, Quick Actions
- Integration clients: GitHub (Octokit), Supabase, Neon, Stytch, Linear, Hugging Face, Postman
- GitHub webhook receiver with HMAC signature verification
- Supabase schema: constellation_repos, github_events, ai_calls, session_state
- Postman collection: health check + integration status tests
- `.env.example` covering all 9 integrations
- `mermicorn.repo.yaml` constellation manifest
