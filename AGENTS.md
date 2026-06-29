# AGENTS.md

## Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated.
Always retrieve current documentation before any Workers, KV, R2, D1, Durable
Objects, Queues, Vectorize, AI, or Agents SDK task.

Use product `/platform/limits/` pages for limits and quotas.

## Astryx Design System

Before writing UI code:

1. `npx astryx template --list`
2. `npx astryx template <name> --skeleton`
3. `npx astryx component <Name>` for every component used

Rules:

- No raw `<div>` elements in UI code.
- No `style={{}}`; use `xstyle`.
- Use AppShell for full-page shells.
- Use SideNav for sidebar navigation.
- Use Section for page regions and Card only for discrete items.
- Use design tokens from `npx astryx docs tokens`.
