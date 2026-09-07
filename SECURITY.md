# Security Policy — command-board

## Non-negotiable controls

- Never commit API keys, tokens, database URLs, webhook secrets, or production exports.
- Use Vercel / host environment variables for runtime secrets (GitHub, Linear, Supabase, Stytch, Neon, Sentry, Hugging Face).
- Treat all provider payloads as untrusted input; validate and minimize before persistence or display.
- Prefer least-privilege tokens (read-only where possible; scoped webhooks).
- Require explicit review for auth, agent, and connector integration changes.

## Reporting

Email: **cyber.lazer.mermicorn@gmail.com**  
Subject: `Security Vulnerability — command-board`

Include: description, reproduction steps, impact, suggested fix if any.

## Response targets

- Acknowledgment: within 24 hours
- Initial assessment: within 48 hours
- Critical remediation: within 7 days

## Incident handling

1. Revoke exposed credentials in the affected provider.
2. Rotate dependent tokens and webhook secrets.
3. Remove secrets from git history if committed.
4. Document incident and remediation in the private ops record.
