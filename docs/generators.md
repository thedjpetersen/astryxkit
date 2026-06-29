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

| Generator                               | Default path                                            | Why it exists                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `shell <product-name>`                  | `src/shell/<product-name>.tsx`                          | Host products need consistent `ShellHost`, `AstryxKitProvider`, `ShellFrame`, and `ShellAppOutlet` wiring.                            |
| `app <app-name>`                        | `src/apps/<app-name>/index.tsx`                         | Micro-apps repeat the same manifest, lazy activation, default commands, preferences, and render surface.                              |
| `command <app-id>.<command-name>`       | `src/commands/<app-id>/<command-name>.ts`               | Commands are core extension points and should be declared in a consistent shape before they are bound to product behavior.            |
| `preference <app-id>.<preference-name>` | `src/preferences/<app-id>/<preference-name>.ts`         | Preference schemas are shared by manifests, settings UI, and preference resolution; scaffolding keeps keys and categories consistent. |
| `worker-route <route-name>`             | `src/worker/routes/<route-name>.ts`                     | Cloudflare Worker APIs should start as explicit `WorkerRoute` modules using shared JSON helpers.                                      |
| `d1-repository <resource-name>`         | `src/worker/repositories/<resource-name>-repository.ts` | D1 access benefits from small typed repositories that keep binding lookup and prepared statements close together.                     |

## Output Contract

Generated files should be useful immediately, but they should not pretend to be
final product code.

- Shell output wires `ShellHost`, `AstryxKitProvider`, `ShellFrame`, and
  `ShellAppOutlet`.
- App output wires a manifest, lazy activation function, default commands,
  starter preference, and first Astryx UI surface.
- Command output creates a namespaced `CommandContribution` and an activation
  binder.
- Preference output creates a namespaced `PreferenceSchema`.
- Worker route output creates an explicit route module with request context.
- D1 repository output creates a small typed repository around a named binding.

Generated files should be reviewed before commit. The generator gives the next
correct file, not a complete product architecture.

## Options

```bash
ak --help
ak version
ak generators
ak generate --list
ak g app Catalog --dir src/features
ak g worker-route catalog --dry-run
ak g preference catalog.density --force
```

- `--dir <path>` changes the output root for a generator.
- `--dry-run` prints what would be created without writing files.
- `--force` overwrites existing files.
- `--list` or `-l` prints available generators from the `generate` command.
- `--version`, `-v`, and `version` print the package version.
- `help`, `--help`, and `-h` print root usage.

Generator output prints one action per planned file:

```text
create    src/apps/catalog/index.tsx
skip      src/worker/routes/catalog.ts
overwrite src/preferences/catalog/density.ts
```

- `create` means a new target was written, or would be written during
  `--dry-run`.
- `skip` only appears during `--dry-run` when the target already exists.
- `overwrite` means an existing target was replaced because `--force` was
  provided.

Existing files are protected by default. Without `--force`, an existing target
aborts generation and exits with an error.

## Naming and Paths

Names are normalized before file plans are created:

- `Northstar` becomes `northstar.tsx`, `NorthstarShell`, and `northstarHost`.
- `Customer Ledger` becomes `customer-ledger`.
- Scoped command and preference names must include an app scope, such as
  `catalog.refresh` or `catalog.density`.
- Worker route names generate `src/worker/routes/<name>.ts` and a starter
  pathname of `/api/<name>`.
- D1 repository names generate `<name>-repository.ts`; hyphenated table stems
  are converted to underscores in the starter SQL.

When `--dir` is used, it replaces the generator default root. For example,
`ak g app Catalog --dir src/features` writes
`src/features/catalog/index.tsx`, not `src/features/src/apps/catalog/index.tsx`.

## Suggested Flow

```bash
ak g shell Northstar
ak g app Catalog
ak g command catalog.refresh
ak g preference catalog.density
ak g worker-route catalog
ak g d1-repository customer
```

Start with shell wiring, add a lazy micro-app, then extract commands,
preferences, Worker routes, and D1 repositories when those seams need tests,
reuse, or clearer ownership.

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

## When Not To Generate

Do not use a generator when the output would hide a product decision:

- choosing Worker bindings;
- designing a D1 schema or migration;
- deciding authorization and tenancy;
- creating app-specific routing conventions;
- selecting a deployment topology.

Use the generator for the stable framework seam, then write the product-specific
parts by hand.
