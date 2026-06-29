# Architecture

AstryxKit separates product code from shell infrastructure.

## Mental Model

Think of AstryxKit as the layer between a product shell and independently owned
micro-apps:

- the host product owns routes, deployment, Cloudflare bindings, data schemas,
  and product policy;
- the shell runtime owns app registration, activation, command routing,
  context, preferences, and app-scoped disposal;
- each micro-app owns its manifest, commands, preferences, feature flags, and
  rendered surface;
- the React package renders shared shell UI without owning app content.

This keeps the framework useful for platform-style products without turning it
into a page framework or deployment abstraction.

## Core Runtime

The core runtime owns:

- command declarations and dynamic command sources
- context keys for feature gates and active app state
- layered preferences across platform, product, app, feature, user, and default
- app manifest registration and activation lifecycle
- app-scoped disposal for handlers, command sources, and subscriptions
- import-map generation for independently shipped app modules

Applications contribute `ShellAppManifest` objects. Manifests declare commands and
preferences up front, then lazy-load their module only when activated.

### Host Lifecycle

1. Construct a `ShellHost`.
2. Register one or more manifests with `host.register()` or `host.registerAll()`.
3. Render app navigation from `host.getManifests()`.
4. Activate an app by route with `host.activate(appId)`.
5. Bind app handlers during activation with `context.disposeWithApp(...)`.
6. Deactivate the app when leaving its route or disposing the host.

Activation sets the `appActive` context key and creates an app-scoped
`DisposableStore`. Deactivation clears active feature context, disposes handlers
and subscriptions, clears `appActive`, and removes the active render surface.

### Commands

Commands are declared early and can be bound later. This lets the command
palette show product navigation and app capabilities before the app module is
loaded. When a command has no bound handler, the host activator can load the
owning app before execution.

Command ranking considers:

- command ring: platform, product, app, or feature;
- prefix mode: actions (`>`), pages (`/`), entities (`@`), or help (`?`);
- shortcode matches for stable human-facing identifiers;
- fuzzy text score;
- context expressions from `when`;
- recent command history.

Use `shortcodes` for canonical record or workflow IDs that users can type,
share, or route to directly, such as `T00000A`, `INV-2048`, or `CASE-17`.
Use `keywords` for loose discovery terms and synonyms. Shortcode matching is
case-insensitive, accepts a leading `#` in the query, and exact shortcode
matches rank ahead of normal title and keyword matches within the same command
ring. Host products can call `host.commandForShortcode(code)` when implementing
Stitchdash-style short-link redirects or deep-link resolution.

### Preferences

Preferences are declared as schemas and resolved through explicit layers:

1. feature
2. app
3. product
4. platform
5. schema default

User values are stored separately from contributed seed values. Inspection keeps
the resolved value, source ring, source scope, inheritance state, user override
state, and per-layer values available to settings UI.

## React Runtime

The React layer owns:

- `ShellFrame` for the Astryx `AppShell`, top navigation, side navigation, and
  command palette trigger
- `ShellAppOutlet` for activating and rendering the selected app
- `ShellCommandPalette` for ranked commands, entity actions, child commands, and
  recent actions
- `ShellPreferencesPanel` for inspecting and editing layered preferences
- hooks for context keys, command sources, preference inspection, and host state

UI code uses Astryx components and StyleX `xstyle` rules. It does not use raw
layout elements or inline styles.

## Worker Runtime

The Worker helpers stay intentionally small:

- JSON responses and errors
- defensive JSON body parsing
- exact and regex route matching
- optional asset fallback
- D1 binding and prepared statement helpers
- health response metadata
- apex-domain redirects

Cloudflare APIs and limits change, so Worker-related changes should always be
checked against current Cloudflare docs before implementation.

## Non-Goals

AstryxKit does not generate or hide:

- product routing files;
- Cloudflare bindings or `wrangler` configuration;
- database migrations;
- tenant or authorization policy;
- application data schemas;
- deployment topology.

Those are product decisions and should remain explicit in the host app.
