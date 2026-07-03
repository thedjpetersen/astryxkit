# AstryxKit

[![npm version](https://img.shields.io/npm/v/astryxkit.svg)](https://www.npmjs.com/package/astryxkit)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-556cd6)](https://thedjpetersen.github.io/astryxkit/)
[![License: MIT](https://img.shields.io/badge/license-MIT-0d8626.svg)](LICENSE)

AstryxKit is a reusable framework for building Cloudflare Workers applications
with an Astryx design-system shell, isolated micro-app modules, a command
palette, layered preferences, and small Worker API helpers.

It is intentionally framework-shaped rather than product-shaped. Host
applications own their product routes, bindings, schema, and deployment model;
AstryxKit provides the shared shell runtime and UI conventions those products
can build on.

![AstryxKit docs site](docs/assets/astryxkit-docs-home.png)

## What Is Included

| Export                    | Purpose                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `astryxkit/core`          | Shell runtime: commands, context keys, events, app manifests, activation lifecycle, preferences, workspace entity sources, AI-attribution normalization, and import-map helpers. |
| `astryxkit/react`         | React bindings, the Astryx shell frame, app outlet, command palette, preferences panel, share-code chip, and AI-attribution badge.                                               |
| `astryxkit/design-system` | Default Astryx theme wrapper, appearance mode storage, and shared media-query constants.                                                                                         |
| `astryxkit/worker`        | Small Cloudflare Workers HTTP, D1, short-link, capability-guard, CSRF, and rate-limit helpers that keep API boundaries explicit.                                                 |

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

The package is published as
[`astryxkit`](https://www.npmjs.com/package/astryxkit) on npm. The public docs
site is hosted at https://thedjpetersen.github.io/astryxkit/.

AstryxKit keeps React, Astryx Core, and StyleX as peer dependencies so the host
application owns its UI runtime.

## Shell Runtime

```ts
import { ShellHost, createShellSDK } from "astryxkit/core";

const sdk = createShellSDK({ platformId: "my-platform" });
const host = new ShellHost({
  shell: sdk,
  preferencesRoute: "/preferences",
  defaultDocsRoute: "/docs",
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

Commands can declare `shortcodes` for stable human-facing IDs that should be
searchable and routeable without being treated as loose keywords:

```ts
host.register({
  id: "tasks",
  name: "Tasks",
  ownerTeam: "Operations",
  route: "/app/tasks",
  entryUrl: "/app/modules/tasks.js",
  icon: "checkDouble",
  commands: [
    {
      id: "tasks.task.pto.open",
      appId: "tasks",
      category: "Tasks",
      title: "PTO reference",
      route: "/app/tasks/T00000A",
      shortcodes: ["T00000A"],
    },
  ],
  load: () => import("@app/tasks"),
});

const command = host.commandForShortcode("t00000a");
```

Shortcode lookup is case-insensitive and accepts a leading `#` in the query.
Use `shortcodes` for canonical record IDs; keep `keywords` for broad discovery
terms and synonyms.

Apps can also contribute **workspace entity sources**: how to enumerate the
things they own (tasks, documents, rooms) so shell surfaces like mention
popups and reference explorers can span every app without hardcoding any of
them. The host aggregates all sources with per-source failure isolation.

```ts
host.register({
  // ...manifest fields as above
  entitySources: [
    {
      id: "tasks:entities",
      appId: "tasks",
      label: "Tasks",
      kinds: [{ id: "task", label: "Task", pluralLabel: "Tasks" }],
      list: async ({ workspace }) => ({
        entities: (await fetchTasks(workspace.slug)).map((task) => ({
          kind: "task",
          route: `/app/tasks/${task.shortCode}`,
          title: task.title,
          code: task.shortCode,
          owner: task.ownerName,
        })),
      }),
    },
  ],
});

const index = await host.listWorkspaceEntities(workspace);
// index.entities, index.corpus, index.failedSourceIds
```

Sources may also return a `corpus` of serialized rich-text bodies;
`findEntityReferences()` scans it to answer "where is this entity
mentioned?", and `filterWorkspaceEntities()` ranks entities for `@`-style
popups. Entity identity for mentions defaults to the entity route; set
`mentionId` when several entities share one route.

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

The React package also ships two small cross-app primitives:

```tsx
import { AiAttributionBadge, ShareCodeChip } from "astryxkit/react";

// Click-to-copy short-link chip; hover shows the full share URL.
<ShareCodeChip code="DLNCHBRF" sharePath="/d/DLNCHBRF" label="Document link" />;

// Visible provenance for AI-produced text; renders nothing for null.
<AiAttributionBadge attribution="Workers AI · Whisper" />;
```

`ShareCodeChip` pairs with the Worker short-link helpers below so every app
presents codes the same way. `AiAttributionBadge` pairs with
`normalizeAiAttribution()` from `astryxkit/core` so AI-generated content
always carries a visible source.

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

The design-system module also exports shared `mediaQueries` constants
(StyleX `defineConsts`) so apps stop re-declaring capability and breakpoint
queries per component:

```ts
import { mediaQueries } from "astryxkit/design-system";

const styles = stylex.create({
  trigger: {
    backgroundColor: {
      default: "transparent",
      ":hover": {
        default: "transparent",
        [mediaQueries.canHover]: "var(--color-overlay-hover)",
      },
    },
    transitionDuration: {
      default: "var(--duration-fast)",
      [mediaQueries.reducedMotion]: "0ms",
    },
  },
});
```

Cross-package StyleX constants require `unstable_moduleResolution` in the
consuming app's StyleX Babel config.

## Cloudflare Workers

AstryxKit keeps Worker helpers small and explicit. Current Cloudflare docs
should still be checked before changing Workers, D1, KV, R2, Durable Object,
Queue, Vectorize, Workers AI, or Agents SDK behavior.

Beyond routing, JSON, and D1 helpers, the Worker module covers platform-wide
short links: `generateShortCode()` for opaque codes (`D7KQ2M9X`),
`generateReadableCode()` for read-aloud codes (`kfq4-x2mh`), and
`createShortLinkRoute()` to resolve `/d/<code>`-style paths into app routes:

```ts
import { createShortLinkRoute, createWorkerRouter } from "astryxkit/worker";

const router = createWorkerRouter<Env>({
  routes: [
    createShortLinkRoute({
      pathPrefix: "/d",
      resolve: (code, { env }) => lookupDocumentRoute(env, code),
    }),
  ],
});
```

The kit also ships a generic access-control primitive shared by all three
layers. `astryxkit/core` provides the pure model and policy engine:
`defineAccessControl()` turns a host's permission registry + role map into a
model, `computeEffectivePermissions()` resolves `(role + grants) - denies`
(denies win, unknown values are ignored), and `authorize()`/`can()` answer
capability questions deny-by-default, including self-scoped permissions
("edit your OWN comment"). `astryxkit/worker` enforces it at the boundary
with `requireCapability()`/`createCapabilityGuard()` (401 vs 403), plus
double-submit CSRF helpers (`generateCsrfToken`, `issueCsrfCookie`,
`verifyCsrf`) and a fixed-window `createD1RateLimiter()` whose table the
host migrates (`buildRateLimitTableSql`). `astryxkit/react` closes the loop
with the headless `CapabilityProvider`/`useCan()` bindings and
`usePermissionEditor()` for grant/deny override UIs. Permission strings,
storage, and business rules stay in the host product.

- Workers docs: https://developers.cloudflare.com/workers/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- D1 docs: https://developers.cloudflare.com/d1/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/

The retrieved documentation notes for this repo are in
[`docs/cloudflare.md`](docs/cloudflare.md).

## Docs Site

The static docs site lives in [`site/`](site/) and is built with Vite. Code
snippets are rendered with a symbol-aware highlighter: identifiers that match
an AstryxKit export link to docco-style annotated source pages (the `Source`
tab), where comment prose sits beside the code it describes and every
declaration is deep-linkable via `#/source/<module>?s=<Symbol>`.
The public site is hosted at https://thedjpetersen.github.io/astryxkit/.

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

## CLI

AstryxKit ships an `ak` CLI for Rails-like generators. It is also exposed as
`astryxkit` for environments where the short binary is less clear.

```bash
ak generators
ak --version
ak g shell Northstar
ak g app Catalog
ak g command catalog.refresh
ak g preference catalog.density
ak g worker-route catalog
ak g d1-repository customer
```

Generators create the repeated extension points that appear in AstryxKit host
apps: shell composition, micro-app manifests, command contributions, preference
schemas, Worker routes, and D1 repositories. See
[`docs/generators.md`](docs/generators.md) for the full rationale and options.

To verify the published CLI from the registry:

```bash
npx astryxkit@latest --version
npx astryxkit@latest generators
```

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
