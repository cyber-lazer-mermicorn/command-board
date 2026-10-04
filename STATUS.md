# Status — command-board

| Field | Value |
|-------|-------|
| **Status** | Active — soft health + live CI/Linear routes |
| **Last Updated** | 2026-10-04 |
| **Phase** | Foundation + live panels |

## What is real

| Area | Present |
|------|--------|
| Next.js App Router | Yes |
| Dashboard + gate | Yes (token gate when `COMMAND_BOARD_ACCESS_TOKEN` set) |
| Constellation API + panel | Live |
| Deployments API + panel | Soft env |
| GitHub Actions API + panel | Live (`/api/github/actions`) |
| Linear API + panel | Live soft (`/api/linear`) |
| Health | Soft-fail optional services — always 200 JSON |
| Stytch full passwordless | Not complete — token gate interim |

## Priority next

1. Wire Stytch end-to-end when project keys available.
2. Productize HF / observability panels with real signals.
3. Align README structure tree with actual `app/` paths.

See [README.md](README.md).
