# Architecture

AstryxKit separates product code from shell infrastructure.

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
