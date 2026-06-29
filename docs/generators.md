# AstryxKit Generators

The `ak` CLI provides Rails-like generators for the pieces that repeat across
AstryxKit host applications. The intent is to create the first useful version of
a file, not to hide product-specific decisions.

```bash
ak generators
ak generate <generator> <name>
ak g <generator> <name>
```

## Available Generators

| Generator | Default path | Why it exists |
| --- | --- | --- |
| `shell <product-name>` | `src/shell/<product-name>.tsx` | Host products need consistent `ShellHost`, `AstryxKitProvider`, `ShellFrame`, and `ShellAppOutlet` wiring. |
| `app <app-name>` | `src/apps/<app-name>/index.tsx` | Micro-apps repeat the same manifest, lazy activation, default commands, preferences, and render surface. |
| `command <app-id>.<command-name>` | `src/commands/<app-id>/<command-name>.ts` | Commands are core extension points and should be declared in a consistent shape before they are bound to product behavior. |
| `preference <app-id>.<preference-name>` | `src/preferences/<app-id>/<preference-name>.ts` | Preference schemas are shared by manifests, settings UI, and preference resolution; scaffolding keeps keys and categories consistent. |
| `worker-route <route-name>` | `src/worker/routes/<route-name>.ts` | Cloudflare Worker APIs should start as explicit `WorkerRoute` modules using shared JSON helpers. |
| `d1-repository <resource-name>` | `src/worker/repositories/<resource-name>-repository.ts` | D1 access benefits from small typed repositories that keep binding lookup and prepared statements close together. |

## Options

```bash
ak g app Catalog --dir src/features
ak g worker-route catalog --dry-run
ak g preference catalog.density --force
```

- `--dir <path>` changes the output root for a generator.
- `--dry-run` prints what would be created without writing files.
- `--force` overwrites existing files.

## Generator Philosophy

These generators map to the framework seams that are stable in AstryxKit:

- shell composition,
- app registration and activation,
- command contribution and binding,
- preference declaration,
- Worker route boundaries,
- D1 persistence helpers.

They deliberately do not generate Cloudflare bindings, database migrations, or
product routing files. Those decisions depend on the host application and should
stay explicit.
