# AstryxKit

AstryxKit is a reusable framework for building Cloudflare Workers applications
with an Astryx design-system shell, isolated micro-app modules, a command
palette, layered preferences, and small Worker API helpers.

It is intentionally framework-shaped rather than product-shaped:

- `astryxkit/core` contains the shell runtime: commands, context keys, events,
  app manifests, activation lifecycle, preferences, and import-map helpers.
- `astryxkit/react` contains React bindings, the Astryx shell frame, command
  palette, preferences panel, and app outlet.
- `astryxkit/design-system` contains the default Astryx theme wrapper and mode
  storage helpers.
- `astryxkit/worker` contains small Cloudflare Workers request helpers that keep
  APIs explicit and portable.

## Install

```bash
npm install astryxkit @astryxdesign/core @stylexjs/stylex react react-dom
```

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
      brandName="Northstar"
    >
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

## Cloudflare Workers

AstryxKit keeps Worker helpers small and explicit. Current Cloudflare docs should
still be checked before changing Worker, D1, KV, R2, Durable Object, Queue,
Vectorize, AI, or Agents SDK behavior:

- Workers docs: https://developers.cloudflare.com/workers/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- D1 docs: https://developers.cloudflare.com/d1/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/

## Development

```bash
npm install
npm run validate
```
