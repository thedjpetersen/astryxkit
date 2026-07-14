# ADR-0001: Separate the application framework from UI kits

Status: Accepted

## Context

AstryxKit currently combines application lifecycle, shared contracts, React orchestration, Astryx rendering, theming, and generators in one package. A second UI Kit now needs the same application organization without importing Astryx or exposing its internal design-source identity.

## Decision

Maintain three public libraries with one-way dependencies:

1. `app-foundry` owns the design-system-neutral Application Framework.
2. `astryxkit` renders App Foundry through the Astryx design system.
3. `ledgerkit` renders App Foundry through Ledger's Tailwind and Radix design language.

The Presentation Seam is feature-level. App Foundry exposes headless models and controllers for shell navigation, commands, preferences, App Module outlet states, and shared affordances. Each UI Kit owns its components, theme model, icons, layout props, CSS, and generated view recipes.

AstryxKit preserves its current public imports through compatibility re-exports during the 0.x migration.

## Consequences

- App Foundry has no dependency on either UI Kit or its CSS.
- Hosts choose exactly one UI Kit.
- App Modules target App Foundry contracts and remain portable between hosts.
- Neutral generator mechanics live in App Foundry; branded recipes live in each UI Kit.
- Import-map pins and singleton names become neutral, with deliberate compatibility aliases where needed.
- A contract suite verifies both UI Kits against the same feature models.
