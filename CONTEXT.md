# AstryxKit domain context

## Application Framework

The design-system-neutral library that organizes independently developed applications. It owns application manifests, activation, disposal, shared contracts, commands, preferences, events, workspace entities, access control, Worker helpers, and headless React orchestration.

Canonical package name: `app-foundry`.

## UI Kit

A branded library that renders the Application Framework's feature models. A host selects exactly one UI Kit; the Application Framework imports none.

The two supported UI Kits are:

- `astryxkit`, using the Astryx design system.
- `ledgerkit`, using Ledger's Tailwind and Radix design language.

## App Module

An independently developed business capability registered through an application manifest. App Modules collaborate through stable framework contracts rather than shared implementation state.

## Presentation Seam

The feature-level interface between the Application Framework and a UI Kit. It exposes shell navigation models, command-palette controllers, preference models, application outlet states, and shared affordance state. It does not mirror design-system primitives.

## Host

The product-owned composition that creates the application framework runtime, registers App Modules, selects one UI Kit, and supplies product navigation and policy.

## Terms to avoid

- Do not call the Application Framework a design system.
- Do not expose the internal source repository name used to build LedgerKit in LedgerKit interfaces, documentation, generated output, bundles, or storage keys.
- Do not call the Presentation Seam a primitive adapter.
