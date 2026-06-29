# AstryxKit

AstryxKit is a reusable framework for building Cloudflare Workers applications
with an Astryx design-system shell, isolated micro-app modules, a command
palette, layered preferences, and small Worker API helpers.

It is intentionally framework-shaped rather than product-shaped. Host
applications own their product routes, bindings, schema, and deployment model;
AstryxKit provides the shared shell runtime and UI conventions those products
can build on.

![AstryxKit docs site](docs/assets/astryxkit-docs-home.png)

## What Is Included

| Export | Purpose |
| --- | --- |
| `astryxkit/core` | Shell runtime: commands, context keys, events, app manifests, activation lifecycle, preferences, and import-map helpers. |
| `astryxkit/react` | React bindings, the Astryx shell frame, app outlet, command palette, and preferences panel. |
| `astryxkit/design-system` | Default Astryx theme wrapper, appearance mode storage, and shared design-system helpers. |
| `astryxkit/worker` | Small Cloudflare Workers HTTP and D1 helpers that keep API boundaries explicit. |

## When To Use It

Use AstryxKit when you are building a platform-style product where multiple
apps, teams, or workflows need to live inside the same shell.

- You want each app module to register commands, routes, and metadata without
  owning the whole application frame.
- You need command palette behavior, context-aware actions, and preference
  resolution to be shared across products.
- You want Astryx components and theme behavior to stay consistent across host
  apps.
- You are deploying on Cloudflare Workers and want lightweight helpers without
  hiding bindings, limits, or product-specific infrastructure.

## Install

```bash
npm install astryxkit @astryxdesign/core @stylexjs/stylex react react-dom
```

AstryxKit keeps React, Astryx Core, and StyleX as peer dependencies so the host
application owns its UI runtime.

## Shell Runtime

```ts
import { ShellHost, createShellSDK } from "astryxkit/core";

const sdk = createShellSDK({ platformId: "my-platform" });
const host = new ShellHost({
  shell: sdk,
  preferencesRoute: "/preferences",
  docsRoute: "/docs",
});

host.register({
  id: "tasks",
  name: "Tasks",
  ownerTeam: "Operations",
  route: "/app/tasks",
  entryUrl: "/app/modules/tasks.js",
  icon: "checkDouble",
  commands: [
    {
      id: "tasks.open",
      appId: "tasks",
      category: "Apps",
      title: "Open Tasks",
      route: "/app/tasks",
    },
  ],
  load: () => import("@app/tasks"),
});
```

## React Shell

```tsx
import { ShellAppOutlet, ShellFrame } from "astryxkit/react";

export function App() {
  return (
    <ShellFrame
      host={host}
      workspace={{ name: "Northstar", slug: "northstar" }}
      currentPathname="/app/tasks"
      brandName="Northstar">
      <ShellAppOutlet
        appId="tasks"
        host={host}
        workspace={{ name: "Northstar", slug: "northstar" }}
        route={{ pathname: "/app/tasks", slug: "tasks" }}
        navigate={(href) => host.navigate(href)}
      />
    </ShellFrame>
  );
}
```

## Design System

Wrap host applications in `AstryxKitProvider` when they should inherit the
default AstryxKit theme and appearance persistence behavior.

```tsx
import { AstryxKitProvider } from "astryxkit/design-system";

export function Root() {
  return (
    <AstryxKitProvider>
      <App />
    </AstryxKitProvider>
  );
}
```

The framework UI is built from Astryx components. When adding UI to this repo,
follow the local Astryx instructions in `AGENTS.md`: inspect the relevant
template, read every component doc you use, prefer component props, and use
`xstyle` for custom styling.

## Cloudflare Workers

AstryxKit keeps Worker helpers small and explicit. Current Cloudflare docs
should still be checked before changing Workers, D1, KV, R2, Durable Object,
Queue, Vectorize, Workers AI, or Agents SDK behavior.

- Workers docs: https://developers.cloudflare.com/workers/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- D1 docs: https://developers.cloudflare.com/d1/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/

The retrieved documentation notes for this repo are in
[`docs/cloudflare.md`](docs/cloudflare.md).

## Docs Site

The static docs site lives in [`site/`](site/) and is built with Vite.

```bash
npm run docs:dev
npm run docs:build
npm run docs:screenshot
```

- Local docs: `npm run docs:dev -- --port 5174`, then open
  `http://127.0.0.1:5174/astryxkit/`.
- Production build output: `site/dist`.
- README screenshot output: `docs/assets/astryxkit-docs-home.png`.
- GitHub Pages deployment: `.github/workflows/docs.yml`.

## Development

```bash
npm install
npm run validate
```

`npm run validate` runs TypeScript checks, Vitest, the package build, and the
docs build.

## Repository Layout

```text
src/core/           Shell SDK, host runtime, commands, preferences, import maps
src/react/          Shell frame, app outlet, command palette, React hooks
src/design-system/  AstryxKit theme provider and appearance helpers
src/worker/         Cloudflare Workers HTTP and D1 helpers
docs/               Architecture, design-system, Cloudflare notes, screenshots
site/               Vite documentation site
test/               Unit tests
examples/           Minimal host-app example
```

## License

MIT
