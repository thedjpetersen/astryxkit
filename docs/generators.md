# AstryxKit Generator Recipes

The `ak` CLI layers Astryx-specific recipes over App Foundry's neutral generator
engine.

App Foundry owns naming, path containment, overwrite protection, dry runs, and
filesystem writes. AstryxKit owns recipe text that imports Astryx components,
applies `AstryxKitProvider`, and composes the presentation adapter.

```bash
ak generators
ak generate <generator> <name>
ak g <generator> <name>
```

## Recipes

| Recipe | Default path | AstryxKit contribution |
| --- | --- | --- |
| `shell <product>` | `src/shell/<product>.tsx` | Composes `AstryxKitProvider`, `ShellFrame`, and `ShellAppOutlet`. |
| `app <name>` | `src/apps/<name>/index.tsx` | Adds a starter Astryx surface to an App Foundry App Module. |
| `command <app>.<name>` | `src/commands/<app>/<name>.ts` | Creates a typed command binder that Astryx palette surfaces can present. |
| `preference <app>.<name>` | `src/preferences/<app>/<name>.ts` | Creates a schema that Astryx preferences surfaces can render. |
| `worker-route <name>` | `src/worker/routes/<name>.ts` | Compatibility recipe using App Foundry Worker helpers. |
| `d1-repository <name>` | `src/worker/repositories/<name>-repository.ts` | Compatibility recipe using App Foundry D1 helpers. |

The Worker and D1 recipes remain during the `0.x` migration. Their runtime
contracts belong to App Foundry; future neutral scaffolding should be documented
there.

## Safe writes

```bash
ak g app Catalog --dry-run
ak g app Catalog --dir src/features
ak g preference catalog.density --force
```

- `--dry-run` prints the plan without writing.
- `--dir <path>` replaces the recipe's default output root.
- `--force` makes an overwrite explicit.
- Existing files are protected by default.

Generated files are application source. Review, edit, test, and commit them.
The CLI provides a useful first draft, not hidden architecture.

## Ownership after generation

AstryxKit chooses presentation imports and starter composition. App Foundry
defines shared contracts. The host application owns business behavior, routing,
authorization, bindings, schema, migrations, and deployment.

See [App Foundry's generator engine](https://thedjpetersen.github.io/app-foundry/generators/) for the neutral mechanics.
