# AstryxKit Architecture

AstryxKit is the Astryx presentation layer for App Foundry applications.

It receives headless feature models and renders them as a cohesive Astryx shell.
It does not define the application framework underneath that shell.

## What lives here

AstryxKit owns:

- `ShellFrame`, built from Astryx `AppShell`, `TopNav`, and `SideNav`;
- command-palette and preferences presentation;
- App Module loading, empty, error, and recovery surfaces;
- the Astryx theme provider and appearance persistence;
- shared StyleX media conditions;
- Astryx-branded generator recipes; and
- `0.x` compatibility exports for applications migrating to App Foundry.

## What lives in App Foundry

App Foundry owns manifests, activation and disposal, commands, preferences,
events, entities, access control, import maps, headless React models, Worker
helpers, and neutral generator mechanics.

New application code imports those contracts from `app-foundry/core`,
`app-foundry/react`, or `app-foundry/worker`.

See the canonical [App Foundry architecture](https://github.com/thedjpetersen/app-foundry/blob/main/docs/architecture.md).

## The presentation seam

The boundary is feature-level. AstryxKit implements a frame, command palette,
preferences surface, App Module outlet, and error boundary. It does not wrap or
mirror every Astryx primitive as a framework abstraction.

This keeps App Modules portable. Domain behavior depends on App Foundry
contracts, while a host selects AstryxKit when it wants Astryx presentation.

## Host-owned decisions

The host product still owns routes, customer policy, authorization, bindings,
persistence, schema, and deployment. AstryxKit should not hide those choices.

## Compatibility

During the `0.x` split, `astryxkit/core` and `astryxkit/worker` re-export App
Foundry for incremental migration. They are compatibility paths, not the target
architecture for new code.
