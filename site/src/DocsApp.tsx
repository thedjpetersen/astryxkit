import {
  AppShell,
  Badge,
  Button,
  Code,
  Heading,
  HStack,
  Icon,
  Link,
  SideNav,
  SideNavItem,
  SideNavSection,
  Text,
  TextInput,
  TopNav,
  TopNavHeading,
  TopNavItem,
  VStack,
  type BadgeVariant,
  type IconName,
} from "@astryxdesign/core";
import { defineTheme } from "@astryxdesign/core/theme";
import {
  borderVars,
  colorVars,
  fontWeightVars,
  radiusVars,
  shadowVars,
  spacingVars,
  textSizeVars,
  typographyVars,
} from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  PreferencesStore,
  type Disposable,
  type PreferenceRing,
  type PreferenceSchema,
} from "../../src/core";
import { AstryxKitProvider, astryxKitTheme } from "../../src/design-system";
import { AnnotatedSource } from "./annotated";
import { CodeListing, type CodeListingProps } from "./code";
import { sourceModuleById, sourceModules } from "./source-data";

type Surface = {
  body: string;
  code?: string;
  eyebrow: string;
  href?: string;
  icon: IconName;
  title: string;
};

type SpecRow = {
  detail: ReactNode;
  name: string;
  tag: string;
  tagVariant?: BadgeVariant;
};

type LinkRow = {
  href: string;
  label: string;
};

type DocsSectionGroup =
  | "Build"
  | "Concepts"
  | "Reference"
  | "Source"
  | "Start";
type DocsPageId =
  | "build"
  | "motivation"
  | "overview"
  | "quickstart"
  | "reference"
  | "runtime"
  | "source";

type DocsSection = {
  group: DocsSectionGroup;
  icon: IconName;
  id: string;
  label: string;
  pageId: DocsPageId;
  summary: string;
};

type TopNavigationItem = {
  href: string;
  label: string;
  pageId: DocsPageId;
};

type DocsRoute = {
  pageId: DocsPageId;
  sectionId?: string;
};

const docsTheme = defineTheme({
  name: "astryxkit-docs",
  extends: astryxKitTheme,
  tokens: {
    "--color-on-accent": ["#FFFFFF", "#0A1317"],
  },
});

const installSnippet = `npm install astryxkit \\
  @astryxdesign/core @stylexjs/stylex \\
  react react-dom`;

const registryVerifySnippet = `npm view astryxkit version dist-tags bin --json
npx astryxkit@latest --version
npx astryxkit@latest generators`;


const shellSnippet = `import { ShellHost } from "astryxkit/core";
import { ShellFrame, ShellAppOutlet } from "astryxkit/react";

const host = new ShellHost({
  defaultDocsRoute: "/docs",
  preferencesRoute: "/preferences",
});

export function ProductShell() {
  return (
    <ShellFrame
      host={host}
      workspace={{ name: "Northstar", slug: "northstar" }}
      brandName="Northstar"
      currentPathname="/app/catalog">
      <ShellAppOutlet
        appId="catalog"
        host={host}
        workspace={{ name: "Northstar", slug: "northstar" }}
        route={{ pathname: "/app/catalog", slug: "catalog" }}
        navigate={(href) => host.navigate(href)}
      />
    </ShellFrame>
  );
}`;

const manifestSnippet = `host.register({
  id: "catalog",
  name: "Catalog",
  ownerTeam: "Platform",
  route: "/app/catalog",
  entryUrl: "/app/modules/catalog.js",
  icon: "viewColumns",
  commands: [
    {
      id: "catalog.open",
      appId: "catalog",
      category: "Apps",
      title: "Open Catalog",
      route: "/app/catalog",
      kind: "page",
    },
  ],
  preferences: [catalogDensityPreference],
  load: () => import("@app/catalog"),
});`;

const activationSnippet = `export function activate(
  context: ShellAppActivationContext
): ShellAppInstance {
  context.disposeWithApp(
    context.shell.commands.bind("catalog.refresh", async () => {
      context.shell.events.emit("catalog.refreshed", {
        refreshedAt: new Date().toISOString(),
      });
    })
  );

  return {
    dispose() {},
    render: ({ host }) => <CatalogApp host={host} />,
  };
}`;

const commandSnippet = `const refreshCommand: CommandContribution = {
  id: "catalog.refresh",
  appId: "catalog",
  category: "Catalog",
  title: "Refresh Catalog",
  icon: "check",
  kind: "action",
  ring: "app",
  shortcodes: ["CAT-REFRESH"],
  when: "appActive == 'catalog'",
  shortcut: { modifiers: ["meta", "shift"], key: "r" },
};`;

const preferenceSnippet = `export const catalogDensityPreference: PreferenceSchema = {
  key: "catalog.density",
  appId: "catalog",
  category: "Display",
  label: "Density",
  description: "Controls how much spacing Catalog uses.",
  type: "enum",
  defaultValue: "comfortable",
  options: [
    { label: "Compact", value: "compact" },
    { label: "Comfortable", value: "comfortable" },
    { label: "Spacious", value: "spacious" },
  ],
};`;

const reactSnippet = `import {
  ShellCommandPalette,
  ShellPreferencesPanel,
  useCommandSource,
  useContextKey,
  usePreferenceInspection,
} from "astryxkit/react";

const source = {
  id: "catalog:bulk-actions",
  appId: "catalog",
  label: "Catalog bulk actions",
  ring: "feature",
  commands,
};

useCommandSource(source, host.getShell());`;

const designSnippet = `import { AstryxKitProvider } from "astryxkit/design-system";
import * as stylex from "@stylexjs/stylex";
import { colorVars, spacingVars } from "@astryxdesign/core/theme/tokens.stylex";

const styles = stylex.create({
  panel: {
    backgroundColor: colorVars["--color-background-card"],
    padding: spacingVars["--spacing-5"],
  },
});`;

const generatorSnippet = `ak generators
ak g shell Northstar
ak g app Catalog
ak g command catalog.refresh
ak g preference catalog.density
ak g worker-route catalog
ak g d1-repository customer

# Preview without writing files.
ak g app Billing --dry-run

# Place generated files in a product folder.
ak g app Catalog --dir src/features`;

const cliReferenceSnippet = `ak --help
ak version
ak generators
ak generate --list

ak generate app Catalog --dir src/features
ak g worker-route catalog --dry-run
ak g preference catalog.density --force`;

const cliOutputSnippet = `create    src/apps/catalog/index.tsx
create    src/commands/catalog/refresh.ts
skip      src/worker/routes/catalog.ts
overwrite src/preferences/catalog/density.ts`;

const cliWorkflowSnippet = `# Start with the product shell.
ak g shell Northstar

# Add a lazy micro-app.
ak g app Catalog

# Extract shared app seams when they need tests or reuse.
ak g command catalog.refresh
ak g preference catalog.density

# Add Worker request and data boundaries.
ak g worker-route catalog
ak g d1-repository customer

# Preview a customized output root first.
ak g app Billing --dir src/features --dry-run`;

const workerSnippet = `import { createWorkerRouter, json } from "astryxkit/worker";
import { catalogRoute } from "./routes/catalog";

export default {
  fetch: createWorkerRouter({
    health: { name: "catalog-api" },
    routes: [catalogRoute],
    assets: (env) => env.ASSETS,
  }),
};`;

const d1Snippet = `import {
  prepareD1Statement,
  requireD1Database,
  runD1Batch,
} from "astryxkit/worker";

export function createCustomerRepository(env: Env) {
  const database = requireD1Database(env, "DB");

  return {
    async create(customer: { id: string; name: string }) {
      await prepareD1Statement(
        database,
        "insert into customers (id, name) values (?, ?)",
        customer.id,
        customer.name
      ).run();
    },
    async delete(id: string) {
      await runD1Batch(database, [
        prepareD1Statement(database, "delete from customers where id = ?", id),
      ]);
    },
  };
}`;

const projectLayoutSnippet = `src/
  shell/
    northstar.tsx
  apps/
    catalog/
      index.tsx
      manifest.ts
      commands.ts
      preferences.ts
  commands/
    catalog/
      refresh.ts
  preferences/
    catalog/
      density.ts
  worker/
    routes/
      catalog.ts
    repositories/
      customer-repository.ts`;

const contextSnippet = `const sdk = host.getShell();

sdk.context.set("catalog.selectionCount", selectedIds.length);

const refreshCommand: CommandContribution = {
  id: "catalog.refresh",
  appId: "catalog",
  category: "Catalog",
  title: "Refresh Catalog",
  when: "appActive == 'catalog' && catalog.selectionCount != 0",
};

const isCatalogActive = useContextKey("appActive", "", sdk) === "catalog";`;

const eventsSnippet = `const host = new ShellHost({
  eventTypes: ["catalog.refreshed", "catalog.failed"],
});

context.disposeWithApp(
  context.shell.events.on("catalog.refreshed", (event) => {
    console.info(event.type, event.timestamp, event.payload);
  })
);

context.shell.events.emit("catalog.refreshed", {
  appId: context.app.id,
  refreshedAt: Date.now(),
});`;

const generatedContractSnippet = `// Generated command files are intentionally small.
export const refreshCatalogCommand: CommandContribution = {
  id: "catalog.refresh",
  appId: "catalog",
  category: "Catalog",
  title: "Refresh Catalog",
  kind: "action",
};

export function bindRefreshCatalogCommand(shell: ShellSDK) {
  return shell.commands.bind(refreshCatalogCommand.id, async () => {
    // Product behavior belongs here.
  });
}`;

const exportMapSnippet = `import { ShellHost, shell } from "astryxkit/core";
import {
  ShellAppOutlet,
  ShellCommandPalette,
  ShellFrame,
  ShellPreferencesPanel,
} from "astryxkit/react";
import { AstryxKitProvider } from "astryxkit/design-system";
import { createWorkerRouter, json } from "astryxkit/worker";`;

const packageSurfaces: Surface[] = [
  {
    body: "The design-system-neutral application framework: manifests, activation and disposal, commands, preferences, events, entities, Worker helpers, generator mechanics, and headless React models.",
    code: "app-foundry",
    eyebrow: "Framework",
    href: "#/runtime/lifecycle",
    icon: "wrench",
    title: "App Foundry",
  },
  {
    body: "The Astryx presentation adapter: AppShell, SideNav, command palette, preferences, app lifecycle states, theming, and branded generator recipes over App Foundry.",
    code: "astryxkit",
    eyebrow: "UI kit",
    href: "#/runtime/design-system",
    icon: "viewColumns",
    title: "AstryxKit",
  },
  {
    body: "An independently branded editorial presentation adapter built with Tailwind and Radix. It implements the same frame, palette, preferences, and app-outlet contracts without importing Astryx.",
    code: "ledgerkit",
    eyebrow: "UI kit",
    icon: "checkDouble",
    title: "LedgerKit",
  },
];

const entitySnippet = `// Each app declares what it owns on its manifest…
host.register({
  // …identity, routing, commands as usual, plus:
  entitySources: [
    {
      id: "tasks:entities",
      appId: "tasks",
      label: "Tasks",
      kinds: [{ id: "task", label: "Task", pluralLabel: "Tasks" }],
      list: async ({ workspace }) => ({
        entities: (await fetchTasks(workspace.slug)).map((task) => ({
          kind: "task",
          route: \`/app/tasks/\${task.shortCode}\`,
          title: task.title,
          code: task.shortCode,
          owner: task.ownerName,
        })),
      }),
    },
  ],
});

// …and the shell answers workspace-wide questions.
const index = await host.listWorkspaceEntities(workspace);
const popup = filterWorkspaceEntities(index.entities, "ana", 8);
const backlinks = findEntityReferences(popup[0], index.corpus);`;

const entityRows: SpecRow[] = [
  {
    detail:
      "Optional manifest field: declared kinds plus one list({ workspace }) call. Sources registered by a manifest are disposed with it.",
    name: "entitySources",
    tag: "contribute",
    tagVariant: "teal",
  },
  {
    detail:
      "Aggregates every source with Promise.allSettled. A broken app degrades to missing entities plus an entry in failedSourceIds — never a rejected index.",
    name: "listWorkspaceEntities",
    tag: "aggregate",
    tagVariant: "blue",
  },
  {
    detail:
      "Merged registry of declared kinds (label, plural, accent) for legends and pickers; first declaration of an id wins.",
    name: "entityKinds",
    tag: "registry",
    tagVariant: "purple",
  },
  {
    detail:
      "Mention identity defaults to the entity route; set mentionId when several entities share one route (people resolving to a shared directory).",
    name: "mentionId",
    tag: "identity",
    tagVariant: "orange",
  },
  {
    detail:
      "Sources may return serialized rich-text bodies; findEntityReferences scans them for mention nodes to answer “where is this referenced?”.",
    name: "corpus",
    tag: "backlinks",
    tagVariant: "green",
  },
  {
    detail:
      "Shared popup ranking — title prefix beats title substring beats code substring — so @-mentions feel identical in every app.",
    name: "filterWorkspaceEntities",
    tag: "rank",
    tagVariant: "cyan",
  },
];

const architectureRows: SpecRow[] = [
  {
    detail:
      "Owns product routes, deployment, Cloudflare bindings, data schemas, authorization, tenancy, and product policy.",
    name: "Host product",
    tag: "product",
    tagVariant: "blue",
  },
  {
    detail:
      "Owns app registration, activation, command routing, context keys, preferences, events, app-scoped disposal, Worker helpers, and presentation-neutral controllers.",
    name: "App Foundry",
    tag: "framework",
    tagVariant: "purple",
  },
  {
    detail:
      "Defines feature-level frame, palette, preferences, outlet, and error-boundary props. It does not mirror design-system primitives.",
    name: "Presentation seam",
    tag: "contract",
    tagVariant: "teal",
  },
  {
    detail:
      "Each owns its components, tokens, icons, layout choices, theme behavior, CSS, and branded generator recipes. A host chooses one.",
    name: "AstryxKit / LedgerKit",
    tag: "UI kits",
    tagVariant: "green",
  },
  {
    detail:
      "Owns a manifest, lazy activation module, commands, preferences, features, and business behavior. It depends on contracts, not either UI kit.",
    name: "App module",
    tag: "domain",
    tagVariant: "orange",
  },
];

const projectLayoutRows: SpecRow[] = [
  {
    detail:
      "The shell module constructs one ShellHost, sets navigation routes, wraps AstryxKitProvider, and renders ShellFrame.",
    name: "src/shell",
    tag: "host",
    tagVariant: "blue",
  },
  {
    detail:
      "Each app folder keeps manifest, activation, local commands, local preferences, and its first rendered surface together.",
    name: "src/apps/<app>",
    tag: "micro-app",
    tagVariant: "teal",
  },
  {
    detail:
      "Shared command modules are useful when commands need tests or are bound from several activation paths.",
    name: "src/commands",
    tag: "commands",
    tagVariant: "purple",
  },
  {
    detail:
      "Shared preference modules keep namespaced keys and schema migrations close to their owning app.",
    name: "src/preferences",
    tag: "settings",
    tagVariant: "green",
  },
  {
    detail:
      "Worker route and repository modules use AstryxKit helpers but keep bindings, auth, and persistence decisions explicit.",
    name: "src/worker",
    tag: "edge",
    tagVariant: "orange",
  },
];

const manifestRows: SpecRow[] = [
  {
    detail:
      "Stable namespace used by commands, preferences, app activation, active-app context, and route matching.",
    name: "id",
    tag: "required",
    tagVariant: "blue",
  },
  {
    detail:
      "Human labels for navigation, loading states, ownership display, and app catalog surfaces.",
    name: "name / ownerTeam",
    tag: "required",
    tagVariant: "teal",
  },
  {
    detail:
      "The route matched by ShellHost.getManifestForPathname. Child paths match by prefix.",
    name: "route",
    tag: "routing",
    tagVariant: "purple",
  },
  {
    detail:
      "Documented module URL plus the lazy loader function that resolves to an activate(context) module.",
    name: "entryUrl / load",
    tag: "module",
    tagVariant: "green",
  },
  {
    detail:
      "Declared immediately during registration so navigation, palette search, and lazy activation can work before module load.",
    name: "commands",
    tag: "extension",
    tagVariant: "orange",
  },
  {
    detail:
      "Preference schemas and seed defaults are registered with the shared PreferencesStore when the manifest is registered.",
    name: "preferences",
    tag: "settings",
    tagVariant: "cyan",
  },
  {
    detail:
      "Feature contributions map a feature id to a context key so host UI and commands can share feature state.",
    name: "features",
    tag: "context",
    tagVariant: "purple",
  },
  {
    detail:
      "Entity sources declare the app's referenceable records so mention popups and reference explorers span every app; the host aggregates them with per-source failure isolation.",
    name: "entitySources",
    tag: "extension",
    tagVariant: "teal",
  },
];

const activationRows: SpecRow[] = [
  {
    detail:
      "The manifest being activated; use it for app id, owner metadata, feature list, and route-local decisions.",
    name: "context.app",
    tag: "activation",
    tagVariant: "blue",
  },
  {
    detail:
      "The ShellHost instance for navigation, manifest lookup, active app state, palette results, settings groups, and events.",
    name: "context.host",
    tag: "host",
    tagVariant: "teal",
  },
  {
    detail:
      "The ShellSDK instance for commands, context, events, and preferences. Prefer this over importing a second singleton.",
    name: "context.shell",
    tag: "sdk",
    tagVariant: "purple",
  },
  {
    detail:
      "Registers command bindings, dynamic sources, event listeners, and subscriptions into the app-scoped DisposableStore.",
    name: "disposeWithApp",
    tag: "cleanup",
    tagVariant: "green",
  },
  {
    detail:
      "The returned instance may render React and must dispose its own app resources when deactivated.",
    name: "ShellAppInstance",
    tag: "render",
    tagVariant: "orange",
  },
];

const contextRows: SpecRow[] = [
  {
    detail:
      "Set or clear shell-wide values. Passing undefined removes a key and notifies subscribers.",
    name: "context.set",
    tag: "write",
    tagVariant: "blue",
  },
  {
    detail:
      "Read a typed value or snapshot the whole map for diagnostic and rendering paths.",
    name: "context.get / snapshot",
    tag: "read",
    tagVariant: "teal",
  },
  {
    detail:
      "Supports truthy keys, negation, equality, inequality, and && clauses for command and preference visibility.",
    name: "context.matches",
    tag: "when",
    tagVariant: "purple",
  },
  {
    detail:
      "ShellHost sets appActive on activation and clears it on deactivate, making app route state available to commands.",
    name: "appActive",
    tag: "built-in",
    tagVariant: "green",
  },
  {
    detail:
      "Feature contributions let the host toggle context keys through setFeatureEnabled(appId, featureId, isEnabled).",
    name: "features",
    tag: "flags",
    tagVariant: "orange",
  },
];

const eventRows: SpecRow[] = [
  {
    detail:
      "Creates a typed ShellEvent with type, payload, and timestamp, then notifies listeners registered for that type.",
    name: "events.emit",
    tag: "publish",
    tagVariant: "blue",
  },
  {
    detail:
      "Returns a Disposable. Bind listeners through disposeWithApp when they belong to an activated app module.",
    name: "events.on",
    tag: "listen",
    tagVariant: "teal",
  },
  {
    detail:
      "ShellHost records only the event types supplied in constructor options so diagnostics remain deliberate.",
    name: "eventTypes",
    tag: "host",
    tagVariant: "purple",
  },
  {
    detail:
      "Returns the captured host event history for UI panels, logs, and support diagnostics.",
    name: "host.events",
    tag: "inspect",
    tagVariant: "green",
  },
];

const docsSections: DocsSection[] = [
  {
    group: "Start",
    icon: "info",
    id: "overview",
    label: "Overview",
    pageId: "overview",
    summary: "Three-library positioning, package surfaces, and the system map.",
  },
  {
    group: "Start",
    icon: "checkDouble",
    id: "motivation",
    label: "Motivation",
    pageId: "motivation",
    summary:
      "How bounded apps and framework layers constrain compounding LLM mistakes.",
  },
  {
    group: "Start",
    icon: "copy",
    id: "install",
    label: "Install",
    pageId: "quickstart",
    summary: "Peer dependency install command and import boundary notes.",
  },
  {
    group: "Start",
    icon: "chevronRight",
    id: "quickstart",
    label: "Quickstart",
    pageId: "quickstart",
    summary: "Create a shell, register an app manifest, and render the outlet.",
  },
  {
    group: "Start",
    icon: "menu",
    id: "project-layout",
    label: "Project layout",
    pageId: "quickstart",
    summary:
      "Where shell, app, command, preference, Worker, and repository files belong.",
  },
  {
    group: "Concepts",
    icon: "viewColumns",
    id: "framework-map",
    label: "Library map",
    pageId: "overview",
    summary: "App Foundry, AstryxKit, and LedgerKit ownership boundaries.",
  },
  {
    group: "Concepts",
    icon: "checkDouble",
    id: "architecture",
    label: "Architecture model",
    pageId: "overview",
    summary:
      "Ownership boundaries between host products, shell runtime, micro-apps, React, and Workers.",
  },
  {
    group: "Concepts",
    icon: "copy",
    id: "manifests",
    label: "App manifests",
    pageId: "runtime",
    summary:
      "The route, module, command, preference, and feature contract for each micro-app.",
  },
  {
    group: "Concepts",
    icon: "clock",
    id: "lifecycle",
    label: "Runtime lifecycle",
    pageId: "runtime",
    summary: "Host construction, app registration, activation, and disposal.",
  },
  {
    group: "Concepts",
    icon: "chevronRight",
    id: "activation-context",
    label: "Activation context",
    pageId: "runtime",
    summary:
      "What activate(context) receives and how app-scoped disposal should be used.",
  },
  {
    group: "Concepts",
    icon: "search",
    id: "commands",
    label: "Commands",
    pageId: "runtime",
    summary: "Palette modes, ranking, lazy activation, and context filtering.",
  },
  {
    group: "Concepts",
    icon: "wrench",
    id: "preferences",
    label: "Preferences",
    pageId: "runtime",
    summary: "Layered settings resolution with scope and source inspection.",
  },
  {
    group: "Concepts",
    icon: "arrowUp",
    id: "events",
    label: "Context and events",
    pageId: "runtime",
    summary:
      "Context keys, when expressions, feature toggles, event emission, and host event history.",
  },
  {
    group: "Concepts",
    icon: "search",
    id: "workspace-entities",
    label: "Workspace entities",
    pageId: "runtime",
    summary:
      "App-contributed entity sources, aggregation with failure isolation, mentions, and backlinks.",
  },
  {
    group: "Concepts",
    icon: "menu",
    id: "react",
    label: "React shell",
    pageId: "runtime",
    summary: "ShellFrame, ShellAppOutlet, command palette, and React hooks.",
  },
  {
    group: "Concepts",
    icon: "checkDouble",
    id: "design-system",
    label: "Design system",
    pageId: "runtime",
    summary: "Astryx primitives, StyleX composition, tokens, and UI rules.",
  },
  {
    group: "Build",
    icon: "menu",
    id: "cli",
    label: "CLI",
    pageId: "build",
    summary: "Generator command surface and scaffold ownership boundaries.",
  },
  {
    group: "Build",
    icon: "copy",
    id: "cli-reference",
    label: "CLI reference",
    pageId: "build",
    summary: "Exact ak commands, flags, stdout actions, and error behavior.",
  },
  {
    group: "Build",
    icon: "chevronRight",
    id: "cli-workflows",
    label: "CLI workflows",
    pageId: "build",
    summary:
      "Recommended scaffold order, naming rules, custom directories, and safe overwrite workflow.",
  },
  {
    group: "Build",
    icon: "copy",
    id: "generators",
    label: "Generators",
    pageId: "build",
    summary: "Generated app, command, preference, Worker route, and D1 files.",
  },
  {
    group: "Build",
    icon: "checkDouble",
    id: "generated-contracts",
    label: "Generated contracts",
    pageId: "build",
    summary:
      "What generated files promise, what they intentionally leave to product code, and when to edit them.",
  },
  {
    group: "Reference",
    icon: "externalLink",
    id: "workers",
    label: "Workers",
    pageId: "reference",
    summary: "HTTP helpers, D1 helpers, and external Cloudflare references.",
  },
  {
    group: "Reference",
    icon: "copy",
    id: "export-map",
    label: "Export map",
    pageId: "reference",
    summary:
      "Package entrypoints, public exports, and the ownership boundary each import implies.",
  },
  {
    group: "Reference",
    icon: "wrench",
    id: "troubleshooting",
    label: "Troubleshooting",
    pageId: "reference",
    summary:
      "Common integration failures around activation, commands, context, preferences, and Workers.",
  },
  {
    group: "Reference",
    icon: "check",
    id: "reference",
    label: "API reference",
    pageId: "reference",
    summary: "Public AstryxKit exports and repository documentation links.",
  },
  {
    group: "Reference",
    icon: "success",
    id: "ship",
    label: "Ship checklist",
    pageId: "reference",
    summary: "Validation, UI inspection, and platform documentation checks.",
  },
  ...sourceModules.map<DocsSection>((module) => ({
    group: "Source",
    icon:
      module.surface === "astryxkit/react"
        ? "viewColumns"
        : module.surface === "astryxkit/worker"
          ? "externalLink"
          : module.surface === "astryxkit/design-system"
            ? "checkDouble"
            : "wrench",
    id: module.id,
    label: module.title,
    pageId: "source",
    summary: `${module.path} — ${module.summary}`,
  })),
];

const docsSectionGroups: Array<{
  ids: string[];
  title: DocsSectionGroup;
}> = [
  {
    title: "Start",
    ids: ["overview", "motivation", "install", "quickstart", "project-layout"],
  },
  {
    title: "Concepts",
    ids: [
      "framework-map",
      "architecture",
      "manifests",
      "lifecycle",
      "activation-context",
      "commands",
      "preferences",
      "events",
      "workspace-entities",
      "react",
      "design-system",
    ],
  },
  {
    title: "Build",
    ids: [
      "cli",
      "cli-reference",
      "cli-workflows",
      "generators",
      "generated-contracts",
    ],
  },
  {
    title: "Reference",
    ids: ["workers", "export-map", "troubleshooting", "reference", "ship"],
  },
  {
    title: "Source",
    ids: sourceModules.map((module) => module.id),
  },
];

const topNavigationItems: TopNavigationItem[] = [
  { href: "#/overview", label: "Overview", pageId: "overview" },
  { href: "#/motivation", label: "Motivation", pageId: "motivation" },
  { href: "#/quickstart", label: "Quickstart", pageId: "quickstart" },
  { href: "#/runtime", label: "Runtime", pageId: "runtime" },
  { href: "#/build", label: "Build", pageId: "build" },
  { href: "#/reference", label: "Reference", pageId: "reference" },
  { href: "#/source", label: "Source", pageId: "source" },
];

const docsSectionIds = docsSections.map((section) => section.id);
const docsSectionById = new Map<string, DocsSection>(
  docsSections.map((section) => [section.id, section]),
);
const docsPages: Record<DocsPageId, { label: string; sectionIds: string[] }> = {
  overview: {
    label: "Overview",
    sectionIds: ["overview", "framework-map", "architecture"],
  },
  motivation: {
    label: "Motivation",
    sectionIds: ["motivation"],
  },
  quickstart: {
    label: "Quickstart",
    sectionIds: ["install", "quickstart", "project-layout"],
  },
  runtime: {
    label: "Runtime",
    sectionIds: [
      "manifests",
      "lifecycle",
      "activation-context",
      "commands",
      "preferences",
      "events",
      "workspace-entities",
      "react",
      "design-system",
    ],
  },
  build: {
    label: "Build",
    sectionIds: [
      "cli",
      "cli-reference",
      "cli-workflows",
      "generators",
      "generated-contracts",
    ],
  },
  reference: {
    label: "Reference",
    sectionIds: [
      "workers",
      "export-map",
      "troubleshooting",
      "reference",
      "ship",
    ],
  },
  source: {
    label: "Annotated source",
    sectionIds: sourceModules.map((module) => module.id),
  },
};

function createDocsHref(pageId: DocsPageId, sectionId?: string) {
  return `#/${pageId}${sectionId ? `/${sectionId}` : ""}`;
}

const lifecycleSteps: Surface[] = [
  {
    body: "Create one ShellHost per product shell. The host owns the ShellSDK, platform commands, navigation delegate, and event history.",
    code: "new ShellHost({ defaultDocsRoute, preferencesRoute })",
    eyebrow: "01",
    icon: "wrench",
    title: "Construct the host",
  },
  {
    body: "Register ShellAppManifest objects before rendering app navigation. Commands and preference schemas become visible immediately.",
    code: "host.register(manifest)",
    eyebrow: "02",
    icon: "menu",
    title: "Register apps",
  },
  {
    body: "Activation lazy-loads the app module, creates an app-scoped DisposableStore, sets appActive, and renders the instance.",
    code: "await host.activate('catalog')",
    eyebrow: "03",
    icon: "chevronRight",
    title: "Activate on route",
  },
  {
    body: "Deactivation clears feature context, disposes app handlers and subscriptions, and removes the active app render surface.",
    code: "host.deactivate()",
    eyebrow: "04",
    icon: "stop",
    title: "Dispose cleanly",
  },
];

const commandBehaviors: Surface[] = [
  {
    body: "Commands can hide behind context expressions such as appActive checks, feature flags, or entity selection state.",
    code: "when: \"appActive == 'catalog'\"",
    eyebrow: "Visibility",
    icon: "eyeSlash",
    title: "Context-aware",
  },
  {
    body: "Palette prefixes reserve distinct mental models for actions, pages, entities, and help.",
    code: ">, /, @, ?",
    eyebrow: "Search",
    icon: "search",
    title: "Prefix modes",
  },
  {
    body: "A command can be declared before its handler exists. The host activates the owning app before execution.",
    code: "commands.setActivator(...)",
    eyebrow: "Lazy",
    icon: "clock",
    title: "Activation bridge",
  },
  {
    body: "Recent commands are retained inside the registry and ranked above normal empty-query results.",
    code: "history.slice(0, 5)",
    eyebrow: "Ranking",
    icon: "arrowUp",
    title: "Useful defaults",
  },
  {
    body: "Shortcodes model stable human-facing IDs such as task codes, invoice codes, or support tickets without overloading search keywords.",
    code: 'shortcodes: ["T00000A"]',
    eyebrow: "Lookup",
    icon: "copy",
    title: "Addressable codes",
  },
];

type CommandKind = "action" | "entity" | "help" | "page";
type CommandModeId = "actions" | "all" | "entities" | "help" | "pages";
type CommandRing = "app" | "feature" | "platform" | "product";

type CommandMode = {
  id: CommandModeId;
  kind?: CommandKind;
  label: string;
  prefix: string;
};

type DemoCommand = {
  description: string;
  id: string;
  kind: CommandKind;
  keywords: string[];
  ring: CommandRing;
  shortcodes?: string[];
  shortcut?: string;
  title: string;
  when?: string;
};

type RankedDemoCommand = DemoCommand & {
  rank: number;
  score: number;
};

const commandModes: CommandMode[] = [
  { id: "all", label: "All", prefix: "" },
  { id: "actions", kind: "action", label: "Actions", prefix: ">" },
  { id: "pages", kind: "page", label: "Pages", prefix: "/" },
  { id: "entities", kind: "entity", label: "Entities", prefix: "@" },
  { id: "help", kind: "help", label: "Help", prefix: "?" },
];

const demoCommands: DemoCommand[] = [
  {
    description:
      "Open the shared preference inspector for platform, product, app, and feature settings.",
    id: "platform.openPreferences",
    kind: "page",
    keywords: ["settings", "configuration", "preferences"],
    ring: "platform",
    shortcut: "Meta ,",
    title: "Open Preferences",
  },
  {
    description:
      "Open the product documentation surface from anywhere in the shell.",
    id: "platform.openDocs",
    kind: "page",
    keywords: ["docs", "help", "reference"],
    ring: "platform",
    title: "Open Documentation",
  },
  {
    description: "Navigate to the Catalog app and activate its lazy module.",
    id: "catalog.open",
    kind: "page",
    keywords: ["catalog", "inventory", "products"],
    ring: "app",
    title: "Open Catalog",
  },
  {
    description: "Refresh the active Catalog workspace and emit a shell event.",
    id: "catalog.refresh",
    kind: "action",
    keywords: ["refresh", "reload", "catalog"],
    ring: "app",
    shortcut: "Meta Shift R",
    shortcodes: ["CAT-REFRESH"],
    title: "Refresh Catalog",
    when: "appActive == 'catalog'",
  },
  {
    description:
      "Archive every selected catalog item through a feature-scoped command source.",
    id: "catalog.bulkArchive",
    kind: "action",
    keywords: ["bulk", "archive", "selected"],
    ring: "feature",
    title: "Archive Selected Items",
    when: "catalog.selectionCount != 0",
  },
  {
    description:
      "Jump directly to the customer entity that owns the selected catalog item.",
    id: "catalog.customer",
    kind: "entity",
    keywords: ["customer", "owner", "account"],
    ring: "app",
    shortcodes: ["CUST-2048"],
    title: "Customer Entity",
  },
  {
    description:
      "Open the task record addressed by its stable short code, matching the Stitchdash task-code pattern.",
    id: "tasks.task.pto.open",
    kind: "entity",
    keywords: ["task", "pto", "ops"],
    ring: "feature",
    shortcodes: ["T00000A"],
    title: "PTO Reference Task",
  },
  {
    description:
      "Explain how Catalog commands are registered, filtered, and activated.",
    id: "catalog.commandHelp",
    kind: "help",
    keywords: ["commands", "palette", "catalog"],
    ring: "app",
    title: "Catalog Command Help",
  },
  {
    description: "Open Billing from the shared shell navigation model.",
    id: "billing.open",
    kind: "page",
    keywords: ["billing", "invoices", "payments"],
    ring: "product",
    title: "Open Billing",
  },
];

const cliCommandRows: SpecRow[] = [
  {
    detail:
      "Prints the root command help, usage block, command list, and generator hint. Exits 0.",
    name: "ak help / --help / -h",
    tag: "help",
    tagVariant: "blue",
  },
  {
    detail:
      "Prints the package version from package.json. The short flag is useful in install and release checks.",
    name: "ak version / --version / -v",
    tag: "version",
    tagVariant: "teal",
  },
  {
    detail:
      "Lists every generator with command shape, default output directory, and description.",
    name: "ak generators",
    tag: "list",
    tagVariant: "purple",
  },
  {
    detail:
      "Lists available generators from the generate command path without requiring a generator name.",
    name: "ak generate --list / ak g -l",
    tag: "list",
    tagVariant: "purple",
  },
  {
    detail:
      "Runs a generator, writes planned files, and prints one action line per file.",
    name: "ak generate <generator> <name>",
    tag: "write",
    tagVariant: "green",
  },
  {
    detail:
      "Short alias for generate. The docs prefer it for examples because generator names are already explicit.",
    name: "ak g <generator> <name>",
    tag: "alias",
    tagVariant: "cyan",
  },
];

const cliOptionRows: SpecRow[] = [
  {
    detail:
      "Overrides the generator output root. The target path must still resolve inside the current working directory.",
    name: "--dir <path> / --dir=path",
    tag: "output",
    tagVariant: "blue",
  },
  {
    detail:
      "Builds the same file plan and prints create or skip actions without creating directories or writing files.",
    name: "--dry-run",
    tag: "preview",
    tagVariant: "teal",
  },
  {
    detail:
      "Allows existing files to be overwritten. Without this flag, an existing target aborts the command.",
    name: "--force / -f",
    tag: "write",
    tagVariant: "orange",
  },
  {
    detail:
      "Prints the generator list from the generate command and exits before name validation.",
    name: "--list / -l",
    tag: "list",
    tagVariant: "purple",
  },
];

const cliActionRows: SpecRow[] = [
  {
    detail:
      "The target did not exist and was written, or would be written during a dry run.",
    name: "create",
    tag: "stdout",
    tagVariant: "green",
  },
  {
    detail:
      "Only appears in dry-run mode when the target already exists. The command does not write.",
    name: "skip",
    tag: "dry-run",
    tagVariant: "teal",
  },
  {
    detail: "The target existed and was replaced because --force was provided.",
    name: "overwrite",
    tag: "force",
    tagVariant: "orange",
  },
  {
    detail:
      "Unknown commands, unknown generators, missing names, existing files without --force, invalid names, and outside-cwd writes return an error.",
    name: "exit 1",
    tag: "error",
    tagVariant: "red",
  },
];

const cliNamingRows: SpecRow[] = [
  {
    detail:
      "Product and app names normalize into kebab-case paths plus PascalCase, camelCase, and title-case identifiers.",
    name: "Northstar / Customer Ledger",
    tag: "names",
    tagVariant: "blue",
  },
  {
    detail:
      "Command and preference generators require an app scope. The parser accepts dots or slashes, but dotted names are the documented convention.",
    name: "catalog.refresh",
    tag: "scoped",
    tagVariant: "purple",
  },
  {
    detail:
      "Route names generate src/worker/routes/<name>.ts and a starter pathname of /api/<name>.",
    name: "worker-route catalog",
    tag: "edge",
    tagVariant: "orange",
  },
  {
    detail:
      "Repository names generate <name>-repository.ts. The starter SQL table stem converts hyphenated names to underscores.",
    name: "d1-repository customer-ledger",
    tag: "D1",
    tagVariant: "cyan",
  },
  {
    detail:
      "When --dir is used, it replaces the generator default root. It does not add src/apps, src/commands, or src/worker automatically.",
    name: "--dir src/features",
    tag: "paths",
    tagVariant: "teal",
  },
];

const cliWorkflowRows: SpecRow[] = [
  {
    detail:
      "Create one host shell entry first. Product routing, registered manifests, and deployment wiring remain product-owned.",
    name: "ak g shell Northstar",
    tag: "start",
    tagVariant: "blue",
  },
  {
    detail:
      "Use the app generator when a route needs a manifest, lazy activation, first commands, a starter preference, and an Astryx view.",
    name: "ak g app Catalog",
    tag: "micro-app",
    tagVariant: "teal",
  },
  {
    detail:
      "Move commands and preferences into shared folders when they need direct tests, reuse, or a clearer ownership boundary.",
    name: "ak g command / preference",
    tag: "extract",
    tagVariant: "purple",
  },
  {
    detail:
      "Generate request and D1 boundaries separately so auth, bindings, schema, tenancy, and route mounting stay explicit.",
    name: "ak g worker-route / d1-repository",
    tag: "edge",
    tagVariant: "orange",
  },
  {
    detail:
      "Run dry-run before custom directories or force overwrites. Treat generated files as reviewed source code, not disposable output.",
    name: "--dry-run before --force",
    tag: "safety",
    tagVariant: "green",
  },
];

const generatorRows: SpecRow[] = [
  {
    detail:
      "Creates product-level ShellHost, AstryxKitProvider, ShellFrame, and ShellAppOutlet wiring.",
    name: "ak g shell <product>",
    tag: "src/shell",
    tagVariant: "blue",
  },
  {
    detail:
      "Creates a manifest, activation function, default open/refresh commands, sample preference, and first view.",
    name: "ak g app <name>",
    tag: "src/apps",
    tagVariant: "teal",
  },
  {
    detail:
      "Creates a typed CommandContribution and binder that is safe to attach during app activation.",
    name: "ak g command <app>.<name>",
    tag: "src/commands",
    tagVariant: "purple",
  },
  {
    detail:
      "Creates a PreferenceSchema with namespaced key, category, label, type, and default value.",
    name: "ak g preference <app>.<name>",
    tag: "src/preferences",
    tagVariant: "green",
  },
  {
    detail:
      "Creates a WorkerRoute module around explicit request context and JSON response helpers.",
    name: "ak g worker-route <name>",
    tag: "src/worker/routes",
    tagVariant: "orange",
  },
  {
    detail:
      "Creates a typed D1 repository wrapper around binding lookup, prepared statements, and batch helpers.",
    name: "ak g d1-repository <name>",
    tag: "src/worker/repositories",
    tagVariant: "cyan",
  },
];

const apiRows: SpecRow[] = [
  {
    detail:
      "Registers manifests, activates micro-app modules, exposes palette/settings/events state, and owns navigation.",
    name: "ShellHost",
    tag: "core",
    tagVariant: "blue",
  },
  {
    detail:
      "The contract for route, owner, commands, preferences, features, entry URL, and lazy app loader.",
    name: "ShellAppManifest",
    tag: "core",
    tagVariant: "teal",
  },
  {
    detail:
      "The lower-level registry, context, event bus, and preferences services used by ShellHost.",
    name: "ShellSDK",
    tag: "core",
    tagVariant: "purple",
  },
  {
    detail:
      "Ranks palette results by command ring, prefix mode, text score, context expression, and recency.",
    name: "CommandRegistry",
    tag: "core",
    tagVariant: "green",
  },
  {
    detail:
      "Looks up the command that owns a stable human-facing shortcode, useful when products implement short-link redirects.",
    name: "host.commandForShortcode",
    tag: "shortcodes",
    tagVariant: "cyan",
  },
  {
    detail:
      "Resolves platform, product, app, feature, user, and default layers while preserving inspection metadata.",
    name: "PreferencesStore",
    tag: "core",
    tagVariant: "orange",
  },
  {
    detail:
      "Renders the Astryx AppShell, top navigation, side app navigation, command trigger, and child outlet.",
    name: "ShellFrame",
    tag: "react",
    tagVariant: "teal",
  },
  {
    detail:
      "Activates the target app and renders its instance through the active route and workspace context.",
    name: "ShellAppOutlet",
    tag: "react",
    tagVariant: "purple",
  },
  {
    detail:
      "Builds a compact Worker fetch handler from explicit routes, health check, asset fallback, and not-found handling.",
    name: "createWorkerRouter",
    tag: "worker",
    tagVariant: "green",
  },
];

const exportRows: SpecRow[] = [
  {
    detail:
      "Barrel export for the main runtime, React helpers, design provider, and Worker helpers. Use when product bundling benefits from one import.",
    name: "astryxkit",
    tag: "root",
    tagVariant: "blue",
  },
  {
    detail:
      "ShellHost, manifest types, ShellSDK services, command registry, preferences store, context service, event bus, and import-map helpers.",
    name: "astryxkit/core",
    tag: "runtime",
    tagVariant: "purple",
  },
  {
    detail:
      "ShellFrame, ShellAppOutlet, ShellCommandPalette, ShellPreferencesPanel, and React hooks for commands, context, settings, and host state.",
    name: "astryxkit/react",
    tag: "ui",
    tagVariant: "teal",
  },
  {
    detail:
      "AstryxKitProvider, astryxKitTheme, appearance storage helpers, and appearance mode types.",
    name: "astryxkit/design-system",
    tag: "theme",
    tagVariant: "green",
  },
  {
    detail:
      "JSON responses, defensive body parsing, Worker router, redirect helper, health response, and D1 binding/statement helpers.",
    name: "astryxkit/worker",
    tag: "edge",
    tagVariant: "orange",
  },
];

const generatedContractRows: SpecRow[] = [
  {
    detail:
      "Generated shell files own product-level wiring only. Register real app manifests and route selection in product code.",
    name: "shell",
    tag: "host",
    tagVariant: "blue",
  },
  {
    detail:
      "Generated app files include a manifest, activation function, default open/refresh commands, sample preference, and first view.",
    name: "app",
    tag: "micro-app",
    tagVariant: "teal",
  },
  {
    detail:
      "Generated command files declare the CommandContribution and a binder. Replace the stub handler with product behavior.",
    name: "command",
    tag: "commands",
    tagVariant: "purple",
  },
  {
    detail:
      "Generated preference files establish the namespaced key, category, label, default, type, and optional migration location.",
    name: "preference",
    tag: "settings",
    tagVariant: "green",
  },
  {
    detail:
      "Generated Worker routes expose WorkerRequestContext and JSON helpers. They do not choose auth, rate limits, or bindings.",
    name: "worker-route",
    tag: "edge",
    tagVariant: "orange",
  },
  {
    detail:
      "Generated D1 repositories wrap a named binding and prepared statements. They do not define migrations or tenancy policy.",
    name: "d1-repository",
    tag: "data",
    tagVariant: "cyan",
  },
];

const troubleshootingRows: SpecRow[] = [
  {
    detail:
      "Check that the manifest is registered before ShellAppOutlet renders and that appId matches the manifest id exactly.",
    name: "App module unavailable",
    tag: "activation",
    tagVariant: "blue",
  },
  {
    detail:
      "Commands must be declared before binding. App commands also need namespaced ids like catalog.refresh.",
    name: "Cannot bind unknown command",
    tag: "commands",
    tagVariant: "purple",
  },
  {
    detail:
      "Use context.shell from activate(context), pass an explicit shell to ShellHost, or avoid creating a second ShellSDK instance.",
    name: "Second shell instance",
    tag: "runtime",
    tagVariant: "teal",
  },
  {
    detail:
      "Confirm the key was declared, the value matches the primitive type, and enum values are listed in options.",
    name: "Preference rejected",
    tag: "settings",
    tagVariant: "green",
  },
  {
    detail:
      "Routes match exact string paths or regexes. Method filters are exact and omitted methods accept any request method.",
    name: "Worker route missed",
    tag: "edge",
    tagVariant: "orange",
  },
  {
    detail:
      "D1 helpers deliberately fail at the repository boundary when the requested env binding is missing or not D1-like.",
    name: "Missing D1 binding",
    tag: "D1",
    tagVariant: "cyan",
  },
  {
    detail:
      "Declare stable IDs in command.shortcodes, not only keywords. Lookup is case-insensitive and accepts a leading # in the query.",
    name: "Shortcode not found",
    tag: "shortcodes",
    tagVariant: "green",
  },
];

const workerRows: SpecRow[] = [
  {
    detail:
      "Returns JSON with the correct content type and an explicit ResponseInit boundary.",
    name: "json",
    tag: "HTTP",
    tagVariant: "blue",
  },
  {
    detail:
      "Parses request JSON defensively and returns an empty object for malformed or non-object bodies.",
    name: "readJsonObject",
    tag: "HTTP",
    tagVariant: "teal",
  },
  {
    detail:
      "Matches exact strings or regular expressions and passes URL, params, env, ctx, and request to handlers.",
    name: "WorkerRoute",
    tag: "Routing",
    tagVariant: "purple",
  },
  {
    detail:
      "Guards D1 binding lookup so missing or misnamed bindings fail at the repository boundary.",
    name: "requireD1Database",
    tag: "D1",
    tagVariant: "green",
  },
];

const docLinks: LinkRow[] = [
  {
    href: "https://github.com/thedjpetersen/astryxkit/blob/main/docs/architecture.md",
    label: "Architecture notes",
  },
  {
    href: "https://github.com/thedjpetersen/astryxkit/blob/main/docs/design-system.md",
    label: "Design-system notes",
  },
  {
    href: "https://github.com/thedjpetersen/astryxkit/blob/main/docs/generators.md",
    label: "Generator rationale",
  },
  {
    href: "https://github.com/thedjpetersen/astryxkit/blob/main/docs/cloudflare.md",
    label: "Cloudflare notes",
  },
];

const cloudflareLinks: LinkRow[] = [
  {
    href: "https://developers.cloudflare.com/workers/",
    label: "Workers docs",
  },
  {
    href: "https://developers.cloudflare.com/workers/platform/limits/",
    label: "Workers limits",
  },
  {
    href: "https://developers.cloudflare.com/d1/",
    label: "D1 docs",
  },
  {
    href: "https://developers.cloudflare.com/d1/platform/limits/",
    label: "D1 limits",
  },
];

function TopNavigation({
  activePage,
  onSearchQueryChange,
  searchQuery,
}: {
  activePage: DocsPageId;
  onSearchQueryChange: (query: string) => void;
  searchQuery: string;
}) {
  const searchResults = useMemo(
    () => searchDocsSections(searchQuery),
    [searchQuery],
  );

  return (
    <TopNav
      xstyle={styles.topNavStripe}
      label="AstryxKit documentation"
      heading={
        <TopNavHeading
          logo={<Icon icon="wrench" color="accent" />}
          heading="AstryxKit"
          subheading="Framework docs"
          headingHref="#/overview"
        />
      }
      startContent={
        <>
          {topNavigationItems.map((item) => (
            <TopNavItem
              key={item.label}
              label={item.label}
              href={item.href}
              isSelected={item.pageId === activePage}
            />
          ))}
        </>
      }
      endContent={
        <section {...stylex.props(styles.topNavActions)}>
          <DocsQuickFind
            query={searchQuery}
            results={searchResults}
            onQueryChange={onSearchQueryChange}
          />
          <Button
            label="GitHub"
            href="https://github.com/thedjpetersen/astryxkit"
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            icon={<Icon icon="externalLink" size="sm" />}
          />
        </section>
      }
    />
  );
}

function DocsQuickFind({
  onQueryChange,
  query,
  results,
}: {
  onQueryChange: (query: string) => void;
  query: string;
  results: DocsSection[];
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <section {...stylex.props(styles.quickFind)} role="search">
      <TextInput
        label="Search docs"
        isLabelHidden
        value={query}
        onChange={onQueryChange}
        placeholder="Search docs"
        startIcon="search"
        hasClear
        htmlName="docsSearch"
        size="sm"
        width="100%"
      />
      {hasQuery ? (
        <section
          {...stylex.props(styles.quickFindResults)}
          aria-label="Docs search results"
          aria-live="polite"
        >
          {results.length > 0 ? (
            <ul {...stylex.props(styles.quickFindList)}>
              {results.map((result) => (
                <li key={result.id} {...stylex.props(styles.quickFindItem)}>
                  <Link
                    href={createDocsHref(result.pageId, result.id)}
                    isStandalone
                    onClick={() => onQueryChange("")}
                  >
                    {result.label}
                  </Link>
                  <Text
                    as="p"
                    display="block"
                    type="supporting"
                    color="secondary"
                  >
                    {result.summary}
                  </Text>
                </li>
              ))}
            </ul>
          ) : (
            <section {...stylex.props(styles.quickFindEmpty)}>
              <Text as="p" display="block" color="secondary">
                No matching docs sections.
              </Text>
            </section>
          )}
        </section>
      ) : null}
    </section>
  );
}

function searchDocsSections(query: string): DocsSection[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return docsSections
    .map((section) => {
      const label = section.label.toLowerCase();
      const id = section.id.toLowerCase();
      const summary = section.summary.toLowerCase();
      const group = section.group.toLowerCase();
      let score = 0;

      if (label.startsWith(normalizedQuery)) {
        score += 20;
      }

      if (label.includes(normalizedQuery)) {
        score += 12;
      }

      if (id.includes(normalizedQuery)) {
        score += 8;
      }

      if (group.includes(normalizedQuery)) {
        score += 4;
      }

      if (summary.includes(normalizedQuery)) {
        score += 3;
      }

      return { section, score };
    })
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        docsSectionIds.indexOf(a.section.id) -
          docsSectionIds.indexOf(b.section.id),
    )
    .slice(0, 6)
    .map((result) => result.section);
}

function SideNavigation({ activeSection }: { activeSection: string }) {
  return (
    <SideNav xstyle={styles.sideNavStripe}>
      {docsSectionGroups.map((group) => (
        <SideNavSection key={group.title} title={group.title}>
          {group.ids.map((id) => {
            const section = docsSections.find((item) => item.id === id);

            if (!section) {
              return null;
            }

            return (
              <SideNavItem
                key={section.id}
                label={section.label}
                href={createDocsHref(section.pageId, section.id)}
                icon={section.icon}
                isSelected={activeSection === section.id}
              />
            );
          })}
        </SideNavSection>
      ))}
    </SideNav>
  );
}

function DocsHero() {
  return (
    <section id="overview" {...stylex.props(styles.heroBand)}>
      <article {...stylex.props(styles.hero)}>
        <section
          {...stylex.props(styles.heroCopy)}
          aria-labelledby="hero-title"
        >
          <HStack gap={2} wrap="wrap">
            <Badge variant="neutral" label="Micro-app shell" />
            <Badge variant="neutral" label="Command runtime" />
            <Badge variant="neutral" label="Worker boundary" />
          </HStack>
          <VStack gap={4}>
            <Heading level={1} type="display-3" id="hero-title">
              The Astryx UI kit for an application framework that scales past
              one app.
            </Heading>
            <Text as="p" type="large" display="block" color="secondary">
              App Foundry gives hosts stable application contracts and headless
              orchestration. AstryxKit renders those contracts with Astryx;
              LedgerKit is an independent alternative over the same feature
              seams. Hosts keep ownership of product routes and infrastructure.
            </Text>
          </VStack>
          <section
            {...stylex.props(styles.actionRow)}
            aria-label="Primary actions"
          >
            <Button
              label="Start quickstart"
              href="#/quickstart/quickstart"
              variant="primary"
              icon={<Icon icon="chevronRight" size="sm" />}
            />
            <Button
              label="Browse reference"
              href="#/reference/reference"
              variant="secondary"
              icon={<Icon icon="search" size="sm" />}
            />
            <Button
              label="Open npm"
              href="https://www.npmjs.com/package/astryxkit"
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              icon={<Icon icon="externalLink" size="sm" />}
            />
            <Button
              label="Open GitHub"
              href="https://github.com/thedjpetersen/astryxkit"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              icon={<Icon icon="externalLink" size="sm" />}
            />
          </section>
        </section>

        <aside
          {...stylex.props(styles.systemFrame)}
          aria-label="AstryxKit system map"
        >
          <header {...stylex.props(styles.systemHeader)}>
            <HStack gap={1.5} align="center">
              <span {...stylex.props(styles.statusDot)} />
              <Text type="supporting" color="secondary">
                three-library architecture
              </Text>
            </HStack>
            <Code>app-foundry → UI kit</Code>
          </header>
          <section {...stylex.props(styles.systemBody)}>
            {packageSurfaces.map((surface) => (
              <SystemRow key={surface.title} surface={surface} />
            ))}
          </section>
          <footer {...stylex.props(styles.metricStrip)}>
            <Metric label="libraries" value="3" />
            <Metric label="generators" value="6" />
            <Metric label="contracts" value="5" />
          </footer>
        </aside>
      </article>
    </section>
  );
}

function SystemRow({ surface }: { surface: Surface }) {
  return (
    <article {...stylex.props(styles.systemRow)}>
      <span {...stylex.props(styles.iconFrame)}>
        <Icon icon={surface.icon} size="sm" color="primary" />
      </span>
      <section {...stylex.props(styles.systemRowCopy)}>
        <HStack gap={2} align="center" wrap="wrap">
          <Text type="label" weight="semibold">
            {surface.title}
          </Text>
          <Code>{surface.code}</Code>
        </HStack>
        <Text as="p" display="block" type="supporting" color="secondary">
          {surface.body}
        </Text>
      </section>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article {...stylex.props(styles.metric)}>
      <Text display="block" type="supporting" color="secondary">
        {label}
      </Text>
      <Text display="block" type="large" weight="semibold">
        {value}
      </Text>
    </article>
  );
}

function Band({
  children,
  id,
  muted = false,
}: {
  children: ReactNode;
  id?: string;
  muted?: boolean;
}) {
  return (
    <section id={id} {...stylex.props(styles.band, muted && styles.bandMuted)}>
      <article {...stylex.props(styles.bandInner)}>{children}</article>
    </section>
  );
}

function SectionHeader({
  badge,
  children,
  title,
}: {
  badge: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <header {...stylex.props(styles.sectionHeader)}>
      <Badge variant="neutral" label={badge} />
      <VStack gap={2}>
        <Heading level={2}>{title}</Heading>
        <Text as="p" display="block" color="secondary">
          {children}
        </Text>
      </VStack>
    </header>
  );
}

function SurfacePanel({ surface }: { surface: Surface }) {
  return (
    <article {...stylex.props(styles.surfacePanel)}>
      <header {...stylex.props(styles.panelHeader)}>
        <span {...stylex.props(styles.iconFrame)}>
          <Icon icon={surface.icon} size="sm" color="primary" />
        </span>
        <Text type="supporting" color="secondary">
          {surface.eyebrow}
        </Text>
      </header>
      <VStack gap={2}>
        <Heading level={3}>{surface.title}</Heading>
        <Text as="p" display="block" color="secondary">
          {surface.body}
        </Text>
      </VStack>
      {surface.code ? (
        <Text as="p" display="block" type="label">
          <Code>{surface.code}</Code>
        </Text>
      ) : null}
      {surface.href ? (
        <Link href={surface.href} isStandalone>
          Open section
        </Link>
      ) : null}
    </article>
  );
}

function Install() {
  return (
    <Band id="install">
      <section {...stylex.props(styles.installStrip)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Install"
            title="Install the Astryx UI kit; App Foundry supplies the runtime."
          >
            AstryxKit depends on App Foundry and keeps React, Astryx Core, and
            StyleX as host-owned peers. App modules should import durable runtime
            contracts from App Foundry; existing AstryxKit core and Worker
            imports remain available during the 0.x migration.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              The package is live on npm as <Code>astryxkit@0.1.0</Code>. Use
              the framework exports directly in product code. The short
              <Code>ak</Code> binary is for scaffolding files; runtime imports
              stay package-scoped so module boundaries remain obvious.
            </Text>
          </section>
          <section {...stylex.props(styles.packageMetaPanel)}>
            <HStack gap={2} wrap="wrap" align="center">
              <Badge variant="success" label="npm latest" />
              <Code>0.1.0</Code>
            </HStack>
            <Link
              href="https://www.npmjs.com/package/astryxkit"
              target="_blank"
              rel="noreferrer"
              isStandalone
            >
              Open npm package
            </Link>
            <Link
              href="https://github.com/thedjpetersen/astryxkit"
              target="_blank"
              rel="noreferrer"
              isStandalone
            >
              Open public repository
            </Link>
          </section>
        </section>
        <aside {...stylex.props(styles.codeStack)} aria-label="Install code">
          <CodeBlock
            title="install.sh"
            language="bash"
            code={installSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
          />
          <CodeBlock
            title="verify-registry.sh"
            language="bash"
            code={registryVerifySnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
          />
        </aside>
      </section>
    </Band>
  );
}

function Quickstart() {
  return (
    <Band id="quickstart" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Quickstart"
            title="Create a shell, register an app, render the outlet."
          >
            The first useful integration is small: construct a host, register a
            manifest, and let the React shell activate the app for the current
            route.
          </SectionHeader>
          <ol {...stylex.props(styles.stepRail)}>
            <Step
              index="01"
              title="Create a product shell"
              body="The host owns platform commands, navigation, app manifests, preference resolution, and app activation."
            />
            <Step
              index="02"
              title="Register app manifests"
              body="A manifest declares route, owner team, entry URL, commands, preferences, features, and a lazy loader."
            />
            <Step
              index="03"
              title="Render ShellFrame and ShellAppOutlet"
              body="The frame supplies navigation and shared shell UI. The outlet activates and renders the selected app instance."
            />
          </ol>
        </section>
        <aside {...stylex.props(styles.codeStack)} aria-label="Quickstart code">
          <CodeBlock
            title="shell.tsx"
            language="tsx"
            code={shellSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={620}
            highlightLines={[4, 5, 10, 15]}
          />
          <CodeBlock
            title="manifest.ts"
            language="ts"
            code={manifestSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={560}
          />
        </aside>
      </section>
    </Band>
  );
}

function Step({
  body,
  index,
  title,
}: {
  body: string;
  index: string;
  title: string;
}) {
  return (
    <li {...stylex.props(styles.stepItem)}>
      <Text type="label" weight="semibold" xstyle={styles.stepIndex}>
        {index}
      </Text>
      <section {...stylex.props(styles.stepCopy)}>
        <Heading level={3}>{title}</Heading>
        <Text as="p" display="block" color="secondary">
          {body}
        </Text>
      </section>
    </li>
  );
}

function FrameworkMap() {
  return (
    <Band id="framework-map">
      <SectionHeader
        badge="Library map"
        title="One application framework, two UI kits, three independent libraries."
      >
        App Foundry owns the durable contracts. AstryxKit and LedgerKit render
        those contracts with different design languages. App modules depend on
        the framework and remain portable between hosts.
      </SectionHeader>
      <section {...stylex.props(styles.surfaceGrid)}>
        {packageSurfaces.map((surface) => (
          <SurfacePanel key={surface.title} surface={surface} />
        ))}
      </section>
    </Band>
  );
}

function Motivation() {
  return (
    <Band id="motivation" muted>
      <section {...stylex.props(styles.motivationProse)}>
        <SectionHeader
          badge="Motivation"
          title="Make the platform durable and the apps disposable."
        >
          LLM-assisted development gets less reliable as decisions accumulate.
          A small mistake in infrastructure, state, or an API becomes context
          for the next decision, so errors compound with a power-law-like
          shape.
        </SectionHeader>
        <VStack gap={4}>
          <Text as="p" display="block" color="secondary">
            App Foundry narrows that chain of decisions. Framework layers settle
            recurring choices about runtime, shell behavior, commands,
            preferences, lifecycle, and Worker boundaries before an app asks a
            model to build anything. A selected UI kit settles presentation
            choices without pushing those choices back into the framework.
          </Text>
          <Text as="p" display="block" color="secondary">
            Inside those rails, domain-driven design and package-by-feature
            keep each business capability encapsulated. A mistaken assumption
            stays local instead of leaking through a shared technical layer and
            reshaping every app.
          </Text>
          <Text as="p" display="block" color="secondary">
            Apps can then be developed independently while collaborating through
            stable contracts and APIs. Teams and models share the seams, not the
            implementation. The same app module can sit behind AstryxKit or
            LedgerKit without learning either component system, so parallel work
            does not require a shared pile of internal state.
          </Text>
          <Text as="p" display="block" color="secondary">
            The payoff is disposable leverage. We can bootstrap an app quickly,
            collaborate on it, learn from it, and throw it away without throwing
            away the platform that made it possible.
          </Text>
          <Text as="p" display="block" color="secondary">
            Each framework layer removes choices from the layer below. By the
            time an LLM reaches product code, its responsibility is intentionally
            small: understand the domain, choose the business behavior, and
            implement it.
          </Text>
        </VStack>
      </section>
    </Band>
  );
}

function ArchitectureModel() {
  return (
    <Band id="architecture" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Architecture"
            title="Ownership boundaries are the primary API."
          >
            The framework is useful because it keeps responsibilities explicit:
            product apps own product policy, the shell owns cross-app runtime
            behavior, UI kits own presentation, and app modules contribute
            capabilities through typed contracts.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              Use this model when deciding where code belongs. If a decision
              depends on a customer, workspace, deployment, binding, schema, or
              authorization policy, it belongs to the host product. If it is a
              reusable lifecycle or collaboration rule, it belongs to App
              Foundry. If it is visual, it belongs to the selected UI kit.
            </Text>
          </section>
        </section>
        <SpecTable caption="Ownership model" rows={architectureRows} />
      </section>
    </Band>
  );
}

function ProjectLayout() {
  return (
    <Band id="project-layout">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Project layout"
            title="Keep generated seams close to the code that owns them."
          >
            A host product should be easy to scan: shell wiring at the top,
            micro-app contracts in app folders, reusable command and preference
            modules where they need tests, and Worker code at the request
            boundary.
          </SectionHeader>
          <SpecTable
            caption="Recommended file ownership"
            rows={projectLayoutRows}
          />
        </section>
        <CodeBlock
          title="product-layout"
          language="text"
          code={projectLayoutSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={520}
        />
      </section>
    </Band>
  );
}

function ManifestContract() {
  return (
    <Band id="manifests">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Manifests"
            title="A manifest is the app contract the host can understand before loading code."
          >
            The host registers manifests up front, which makes navigation,
            palette search, settings, and feature state available without
            eagerly importing every micro-app module.
          </SectionHeader>
          <SpecTable caption="ShellAppManifest fields" rows={manifestRows} />
        </section>
        <CodeBlock
          title="manifest.ts"
          language="ts"
          code={manifestSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={620}
        />
      </section>
    </Band>
  );
}

function RuntimeLifecycle() {
  return (
    <Band id="lifecycle" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Runtime"
            title="The host lifecycle is explicit by design."
          >
            AstryxKit keeps the expensive and stateful parts of a shell product
            in one place: registering apps, activating modules, binding
            commands, resolving preferences, and disposing app-scoped resources.
          </SectionHeader>
          <section {...stylex.props(styles.surfaceGridCompact)}>
            {lifecycleSteps.map((surface) => (
              <SurfacePanel key={surface.title} surface={surface} />
            ))}
          </section>
        </section>
        <CodeBlock
          title="activate.tsx"
          language="tsx"
          code={activationSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={620}
          highlightLines={[4, 5, 13]}
        />
      </section>
    </Band>
  );
}

function ActivationContext() {
  return (
    <Band id="activation-context">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Activation"
            title="Activation is where lazy app code becomes shell behavior."
          >
            Register long-lived handlers, event listeners, and dynamic command
            sources through the activation context. The host disposes that work
            when the active app changes.
          </SectionHeader>
          <SpecTable
            caption="ShellAppActivationContext"
            rows={activationRows}
          />
        </section>
        <CodeBlock
          title="activate.tsx"
          language="tsx"
          code={activationSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={620}
          highlightLines={[4, 5, 13]}
        />
      </section>
    </Band>
  );
}

function Commands() {
  return (
    <Band id="commands">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Commands"
            title="Commands are the framework extension point."
          >
            Apps declare commands early, bind handlers when activated, and let
            the shared palette rank results by ring, prefix, context, text
            score, and recency.
          </SectionHeader>
          <section {...stylex.props(styles.surfaceGridCompact)}>
            {commandBehaviors.map((surface) => (
              <SurfacePanel key={surface.title} surface={surface} />
            ))}
          </section>
          <CommandLab />
          <SpecTable
            caption="Command prefix modes"
            rows={[
              {
                name: ">",
                tag: "Actions",
                tagVariant: "blue",
                detail:
                  "Filters to action commands such as refresh, save, rebuild, or approve.",
              },
              {
                name: "/",
                tag: "Pages",
                tagVariant: "teal",
                detail:
                  "Filters to route or href commands for navigation surfaces.",
              },
              {
                name: "@",
                tag: "Entities",
                tagVariant: "purple",
                detail:
                  "Filters to entity commands for records, people, accounts, or other addressable objects.",
              },
              {
                name: "?",
                tag: "Help",
                tagVariant: "green",
                detail:
                  "Filters help-oriented commands and documentation entries.",
              },
            ]}
          />
          <SpecTable
            caption="Command metadata"
            rows={[
              {
                name: "shortcodes",
                tag: "lookup",
                tagVariant: "cyan",
                detail:
                  "Stable human-facing identifiers such as T00000A, INV-2048, or CASE-17. Exact and prefix matches rank above normal title and keyword matches.",
              },
              {
                name: "keywords",
                tag: "search",
                tagVariant: "purple",
                detail:
                  "Discovery terms and synonyms. Use these for broad search, not for canonical record identifiers.",
              },
              {
                name: "shortcut",
                tag: "keyboard",
                tagVariant: "blue",
                detail:
                  "A keyboard accelerator displayed in the palette. This is separate from textual shortcodes.",
              },
              {
                name: "commandForShortcode",
                tag: "routing",
                tagVariant: "green",
                detail:
                  "Host lookup helper for products that want Stitchdash-style short-link redirects or deep-link resolution.",
              },
            ]}
          />
        </section>
        <CodeBlock
          title="command.ts"
          language="ts"
          code={commandSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={520}
        />
      </section>
    </Band>
  );
}

function CommandLab() {
  const [query, setQuery] = useState("catalog");
  const [mode, setMode] = useState<CommandModeId>("all");
  const results = useMemo(() => rankDemoCommands(query, mode), [mode, query]);

  return (
    <section
      {...stylex.props(styles.interactivePanel)}
      aria-labelledby="command-lab-title"
    >
      <header {...stylex.props(styles.interactiveHeader)}>
        <section {...stylex.props(styles.interactiveTitle)}>
          <Badge variant="neutral" label="Live model" />
          <VStack gap={1}>
            <Heading level={3} id="command-lab-title">
              Command ranking lab
            </Heading>
            <Text as="p" display="block" color="secondary">
              The list below uses the same ideas as the runtime: prefix mode,
              ring weight, text match, context, and recency-ready sorting.
            </Text>
          </VStack>
        </section>
        <Badge variant="neutral" label={`${results.length} results`} />
      </header>
      <section {...stylex.props(styles.commandControls)}>
        <TextInput
          label="Command query"
          value={query}
          onChange={setQuery}
          placeholder="Search commands"
          startIcon="search"
          hasClear
          width="100%"
        />
        <section
          {...stylex.props(styles.modeButtons)}
          aria-label="Command prefix modes"
        >
          {commandModes.map((item) => (
            <Button
              key={item.id}
              label={`${item.prefix || "All"} ${item.label}`}
              size="sm"
              variant={item.id === mode ? "secondary" : "ghost"}
              onClick={() => setMode(item.id)}
            />
          ))}
        </section>
      </section>
      <ol {...stylex.props(styles.resultList)} aria-live="polite">
        {results.length > 0 ? (
          results.map((command) => (
            <li key={command.id} {...stylex.props(styles.resultItem)}>
              <article {...stylex.props(styles.resultCard)}>
                <section {...stylex.props(styles.resultRank)}>
                  <Text type="label" weight="semibold" hasTabularNumbers>
                    {String(command.rank).padStart(2, "0")}
                  </Text>
                </section>
                <section {...stylex.props(styles.resultCopy)}>
                  <header {...stylex.props(styles.resultHeader)}>
                    <HStack gap={2} align="center" wrap="wrap">
                      <Text type="label" weight="semibold">
                        {command.title}
                      </Text>
                      <Code>{command.id}</Code>
                    </HStack>
                    <HStack gap={1.5} align="center" wrap="wrap">
                      <Badge variant="neutral" label={command.ring} />
                      <Badge variant="neutral" label={command.kind} />
                      <Text
                        type="supporting"
                        color="secondary"
                        hasTabularNumbers
                      >
                        score {command.score}
                      </Text>
                    </HStack>
                  </header>
                  <Text as="p" display="block" color="secondary">
                    {command.description}
                  </Text>
                  {command.when || command.shortcut || command.shortcodes ? (
                    <footer {...stylex.props(styles.resultMeta)}>
                      {command.when ? <Code>{command.when}</Code> : null}
                      {command.shortcut ? (
                        <Code>{command.shortcut}</Code>
                      ) : null}
                      {command.shortcodes?.map((shortcode) => (
                        <Code key={shortcode}>{shortcode}</Code>
                      ))}
                    </footer>
                  ) : null}
                </section>
              </article>
            </li>
          ))
        ) : (
          <li {...stylex.props(styles.emptyResult)}>
            <Text as="p" display="block" color="secondary">
              No commands match the current query and prefix mode.
            </Text>
          </li>
        )}
      </ol>
    </section>
  );
}

function rankDemoCommands(
  query: string,
  modeId: CommandModeId,
): RankedDemoCommand[] {
  const mode = commandModes.find((item) => item.id === modeId);
  const parsed = parseCommandQuery(query);
  const normalizedQuery = parsed.query;
  const activeKind = parsed.kind ?? mode?.kind;

  return demoCommands
    .filter((command) => (activeKind ? command.kind === activeKind : true))
    .map((command) => {
      const baseScore =
        ringWeights[command.ring] +
        kindWeights[command.kind] +
        (command.when ? 1 : 0);
      const textScore = scoreCommandText(command, normalizedQuery);

      return {
        ...command,
        matchScore: textScore,
        rank: 0,
        score: baseScore + textScore,
      };
    })
    .filter((command) => normalizedQuery.length === 0 || command.matchScore > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 6)
    .map(({ matchScore: _matchScore, ...command }, index) => ({
      ...command,
      rank: index + 1,
    }));
}

function parseCommandQuery(query: string): {
  kind?: CommandKind;
  query: string;
} {
  const trimmed = query.trimStart();
  const mode = commandModes.find(
    (item) => item.prefix && trimmed.startsWith(item.prefix),
  );

  if (!mode) {
    return { query: query.trim().toLowerCase() };
  }

  return {
    kind: mode.kind,
    query: trimmed.slice(mode.prefix.length).trim().toLowerCase(),
  };
}

function scoreCommandText(command: DemoCommand, query: string): number {
  if (!query) {
    return 4;
  }

  const title = command.title.toLowerCase();
  const id = command.id.toLowerCase();
  const description = command.description.toLowerCase();
  const keywords = command.keywords.join(" ").toLowerCase();
  const shortcodes = command.shortcodes ?? [];
  let score = 0;

  for (const shortcode of shortcodes) {
    const normalizedShortcode = shortcode.replace(/^#/, "").toLowerCase();
    const normalizedQuery = query.replace(/^#/, "");

    if (normalizedShortcode === normalizedQuery) {
      score += 22;
    } else if (normalizedShortcode.startsWith(normalizedQuery)) {
      score += 16;
    } else if (normalizedShortcode.includes(normalizedQuery)) {
      score += 8;
    }
  }

  if (title.includes(query)) {
    score += title.startsWith(query) ? 14 : 10;
  }

  if (id.includes(query)) {
    score += 6;
  }

  if (keywords.includes(query)) {
    score += 5;
  }

  if (description.includes(query)) {
    score += 2;
  }

  return score;
}

const ringWeights: Record<CommandRing, number> = {
  platform: 16,
  product: 12,
  feature: 10,
  app: 8,
};

const kindWeights: Record<CommandKind, number> = {
  action: 4,
  entity: 3,
  help: 1,
  page: 2,
};

function Preferences() {
  return (
    <Band id="preferences" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Preferences"
            title="Preference resolution is layered, inspectable, and reversible."
          >
            Preferences resolve through scoped records instead of ad hoc product
            state. The store preserves where a value came from, whether it was
            inherited, and whether a user override exists.
          </SectionHeader>
          <ol {...stylex.props(styles.layerStack)}>
            <Layer
              label="Feature"
              body="Highest seed scope for feature-specific defaults when a feature context is active."
            />
            <Layer
              label="App"
              body="Application-level defaults and user overrides for a micro-app."
            />
            <Layer
              label="Product"
              body="Host-product defaults shared across registered apps."
            />
            <Layer
              label="Platform"
              body="Platform-wide defaults keyed by platformId."
            />
            <Layer
              label="Default"
              body="Schema defaultValue when no scoped record exists."
            />
          </ol>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              Enum values are validated against schema options. Other
              preferences validate against the declared primitive type before
              the value is stored.
            </Text>
          </section>
        </section>
        <CodeBlock
          title="preference.ts"
          language="ts"
          code={preferenceSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={560}
        />
      </section>
      <PreferenceLab />
    </Band>
  );
}

function Layer({ body, label }: { body: string; label: string }) {
  return (
    <li {...stylex.props(styles.layerItem)}>
      <Text type="label" weight="semibold">
        {label}
      </Text>
      <Text as="p" display="block" color="secondary">
        {body}
      </Text>
    </li>
  );
}

const labPreferenceKey = "catalog.density";

const labPreferenceSchema: PreferenceSchema = {
  key: labPreferenceKey,
  appId: "catalog",
  category: "Display",
  label: "Density",
  description: "Row spacing for the Catalog list surface.",
  type: "enum",
  ring: "app",
  featureId: "quick-filter",
  defaultValue: "comfortable",
  options: [
    { label: "Compact", value: "compact" },
    { label: "Comfortable", value: "comfortable" },
    { label: "Spacious", value: "spacious" },
  ],
};

const labSeedValues: Record<PreferenceRing, string> = {
  platform: "comfortable",
  product: "compact",
  app: "spacious",
  feature: "compact",
};

const labRingRows: Array<{ body: string; ring: PreferenceRing }> = [
  {
    ring: "feature",
    body: "Seed scoped to catalog.quick-filter — the most specific ring.",
  },
  { ring: "app", body: "Seed scoped to the catalog app." },
  { ring: "product", body: "Seed shared by every app in the product." },
  { ring: "platform", body: "Seed for the whole install, keyed by platformId." },
];

/**
 * A real PreferencesStore with one declared schema. Every toggle below is a
 * live `contributeValue` / `set` / `reset` call, and the readout is
 * `inspect()` verbatim — the lab cannot drift from the runtime because it
 * *is* the runtime.
 */
function PreferenceLab() {
  const lab = useMemo(() => {
    const preferences = new PreferencesStore("northstar");
    const seeds = new Map<PreferenceRing, Disposable>();

    preferences.declare(labPreferenceSchema);
    seeds.set(
      "platform",
      preferences.contributeValue(
        labPreferenceKey,
        labSeedValues.platform,
        "platform",
      ),
    );
    seeds.set(
      "app",
      preferences.contributeValue(labPreferenceKey, labSeedValues.app, "app"),
    );

    return { preferences, seeds };
  }, []);
  const version = useSyncExternalStore(
    (listener) => lab.preferences.subscribe(listener).dispose,
    () => lab.preferences.snapshotVersion(),
    () => 0,
  );
  const inspection = useMemo(
    () => lab.preferences.inspect(labPreferenceKey),
    [lab, version],
  );
  const winner =
    inspection.source.layer === "user"
      ? "user"
      : inspection.isDefault
        ? "default"
        : inspection.source.ring;

  const toggleSeed = (ring: PreferenceRing) => {
    const existing = lab.seeds.get(ring);

    if (existing) {
      existing.dispose();
      lab.seeds.delete(ring);
      return;
    }

    lab.seeds.set(
      ring,
      lab.preferences.contributeValue(
        labPreferenceKey,
        labSeedValues[ring],
        ring,
      ),
    );
  };

  return (
    <section
      {...stylex.props(styles.interactivePanel)}
      aria-labelledby="preference-lab-title"
    >
      <header {...stylex.props(styles.interactiveHeader)}>
        <section {...stylex.props(styles.interactiveTitle)}>
          <Badge variant="neutral" label="Live model" />
          <VStack gap={1}>
            <Heading level={3} id="preference-lab-title">
              Preference resolution lab
            </Heading>
            <Text as="p" display="block" color="secondary">
              A real <Code>PreferencesStore</Code> resolving{" "}
              <Code>catalog.density</Code>. Contribute and remove seeds, set a
              user override, and watch which layer wins.
            </Text>
          </VStack>
        </section>
        <Badge
          variant={inspection.hasUserOverride ? "success" : "neutral"}
          label={`Resolved: ${String(inspection.value)}`}
        />
      </header>
      <section {...stylex.props(styles.prefLabGrid)}>
        <ol {...stylex.props(styles.prefCascade)} aria-live="polite">
          <li
            {...stylex.props(
              styles.prefRow,
              winner === "user" && styles.prefRowWin,
            )}
          >
            <section {...stylex.props(styles.prefRowMain)}>
              <HStack gap={2} align="center" wrap="wrap">
                <Text type="label" weight="semibold">
                  User
                </Text>
                {winner === "user" ? (
                  <Badge variant="success" label="wins" />
                ) : null}
                {inspection.layers.user != null ? (
                  <Code>{String(inspection.layers.user)}</Code>
                ) : (
                  <Text type="supporting">no override</Text>
                )}
              </HStack>
              <Text as="p" display="block" type="supporting" color="secondary">
                An explicit choice, stored at the schema&apos;s own ring. Beats
                every seed until reset.
              </Text>
            </section>
            <HStack gap={1} align="center" wrap="wrap">
              {(labPreferenceSchema.options ?? []).map((option) => (
                <Button
                  key={String(option.value)}
                  label={option.label}
                  size="sm"
                  variant={
                    inspection.layers.user === option.value
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    lab.preferences.set(labPreferenceKey, option.value, "user")
                  }
                />
              ))}
              <Button
                label="Reset"
                size="sm"
                variant="ghost"
                isDisabled={!inspection.hasUserOverride}
                onClick={() => lab.preferences.reset(labPreferenceKey, "user")}
              />
            </HStack>
          </li>
          {labRingRows.map(({ body, ring }) => {
            const isSeeded = lab.seeds.has(ring);

            return (
              <li
                key={ring}
                {...stylex.props(
                  styles.prefRow,
                  winner === ring && styles.prefRowWin,
                )}
              >
                <section {...stylex.props(styles.prefRowMain)}>
                  <HStack gap={2} align="center" wrap="wrap">
                    <Text type="label" weight="semibold">
                      {ring[0].toUpperCase() + ring.slice(1)}
                    </Text>
                    {winner === ring ? (
                      <Badge variant="success" label="wins" />
                    ) : null}
                    {isSeeded ? (
                      <Code>{labSeedValues[ring]}</Code>
                    ) : (
                      <Text type="supporting">no seed</Text>
                    )}
                  </HStack>
                  <Text
                    as="p"
                    display="block"
                    type="supporting"
                    color="secondary"
                  >
                    {body}
                  </Text>
                </section>
                <Button
                  label={
                    lab.seeds.has(ring)
                      ? "Remove seed"
                      : `Seed "${labSeedValues[ring]}"`
                  }
                  size="sm"
                  variant={lab.seeds.has(ring) ? "secondary" : "ghost"}
                  onClick={() => toggleSeed(ring)}
                />
              </li>
            );
          })}
          <li
            {...stylex.props(
              styles.prefRow,
              winner === "default" && styles.prefRowWin,
            )}
          >
            <section {...stylex.props(styles.prefRowMain)}>
              <HStack gap={2} align="center" wrap="wrap">
                <Text type="label" weight="semibold">
                  Default
                </Text>
                {winner === "default" ? (
                  <Badge variant="success" label="wins" />
                ) : null}
                <Code>{String(labPreferenceSchema.defaultValue)}</Code>
              </HStack>
              <Text as="p" display="block" type="supporting" color="secondary">
                The schema&apos;s own value — the floor the cascade can never
                fall through.
              </Text>
            </section>
          </li>
        </ol>
        <section {...stylex.props(styles.prefReadout)} aria-live="polite">
          <Text type="label" weight="semibold">
            inspect(&quot;{labPreferenceKey}&quot;)
          </Text>
          <HStack gap={2} align="center" wrap="wrap">
            <Badge
              variant="blue"
              label={`source: ${inspection.source.ring}:${inspection.source.scope}`}
            />
            <Badge
              variant={inspection.hasUserOverride ? "success" : "neutral"}
              label={
                inspection.hasUserOverride ? "user override" : "no override"
              }
            />
            <Badge
              variant={inspection.isInherited ? "purple" : "neutral"}
              label={inspection.isInherited ? "inherited" : "own ring"}
            />
          </HStack>
          <Text as="p" display="block" type="supporting" color="secondary">
            Settings UI renders exactly this payload: the resolved value, the
            ring and scope that supplied it, whether it was inherited from a
            wider ring, and whether a user override is in effect. Disposing a
            seed restores whatever it displaced — try removing the app seed
            while a wider ring is active.
          </Text>
        </section>
      </section>
    </section>
  );
}

function RuntimeState() {
  return (
    <Band id="events">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Context and events"
            title="Runtime state is explicit, typed at the boundary, and observable."
          >
            Context keys decide command and preference visibility. Events are
            lightweight diagnostics and coordination points; the host records
            only the event types it was asked to track.
          </SectionHeader>
          <SpecTable caption="Context service" rows={contextRows} />
          <SpecTable caption="Event bus" rows={eventRows} />
        </section>
        <aside
          {...stylex.props(styles.codeStack)}
          aria-label="Context and events examples"
        >
          <CodeBlock
            title="context.ts"
            language="tsx"
            code={contextSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={420}
          />
          <CodeBlock
            title="events.ts"
            language="ts"
            code={eventsSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={460}
          />
        </aside>
      </section>
    </Band>
  );
}

function WorkspaceEntities() {
  return (
    <Band id="workspace-entities" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Entities"
            title="Workspace entities are contributed, aggregated, and mention-ready."
          >
            Cross-app surfaces — @-mention popups, reference explorers,
            workspace pickers — need one index over every app&apos;s records.
            Apps declare entity sources on their manifests; the host
            aggregates them without ever learning an app&apos;s API shape.
          </SectionHeader>
          <ol {...stylex.props(styles.layerStack)}>
            <Layer
              label="Declare"
              body="A manifest names its entity kinds and how to list them for a workspace."
            />
            <Layer
              label="Aggregate"
              body="listWorkspaceEntities runs every source with per-source failure isolation."
            />
            <Layer
              label="Rank"
              body="filterWorkspaceEntities gives every @-popup the same relevance order."
            />
            <Layer
              label="Reference"
              body="findEntityReferences scans the corpus for mention nodes — instant backlinks."
            />
          </ol>
          <SpecTable caption="Entity surface" rows={entityRows} />
        </section>
        <CodeBlock
          title="entity-sources.ts"
          language="ts"
          code={entitySnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={640}
        />
      </section>
    </Band>
  );
}

function ReactShell() {
  return (
    <Band id="react">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="React"
            title="Shell UI is shared, app surfaces stay local."
          >
            The React package gives products a working app shell without
            dictating page content. App teams render through their own
            activation instance; the shell owns common navigation, palette, and
            settings behavior.
          </SectionHeader>
          <SpecTable
            caption="React surface responsibilities"
            rows={[
              {
                name: "ShellFrame",
                tag: "Frame",
                tagVariant: "blue",
                detail:
                  "TopNav, SideNav, command trigger, app navigation, and content outlet composition.",
              },
              {
                name: "ShellAppOutlet",
                tag: "Activation",
                tagVariant: "teal",
                detail:
                  "Activates the app for a route and renders the active instance with workspace and navigation context.",
              },
              {
                name: "ShellCommandPalette",
                tag: "Palette",
                tagVariant: "purple",
                detail:
                  "Searches, drills into child commands, executes handlers, and records recent actions.",
              },
              {
                name: "ShellPreferencesPanel",
                tag: "Settings",
                tagVariant: "green",
                detail:
                  "Groups visible settings by ring and exposes resolved source details to users.",
              },
            ]}
          />
        </section>
        <CodeBlock
          title="react-hooks.ts"
          language="tsx"
          code={reactSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={500}
        />
      </section>
    </Band>
  );
}

function DesignSystem() {
  return (
    <Band id="design-system" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Design system"
            title="Use Astryx primitives, then raise the composition with StyleX."
          >
            Controls, text, navigation, shell layout, and code examples should
            come from Astryx. Higher-order documentation surfaces should be
            authored in StyleX using tokens, not pastel component variants.
          </SectionHeader>
          <section {...stylex.props(styles.decisionList)}>
            <Decision
              title="Prefer neutral surfaces"
              body="Documentation should feel like a technical product surface. Use border, spacing, hierarchy, and code context before color blocks."
            />
            <Decision
              title="Use color as metadata"
              body="Badges, icons, and status text can distinguish concepts. Avoid colored edge strips because they read as decoration instead of structure."
            />
            <Decision
              title="Keep framework rules visible"
              body="No raw div elements, no inline style props, no hardcoded token values, and no product-specific Cloudflare assumptions."
            />
          </section>
        </section>
        <CodeBlock
          title="stylex.ts"
          language="tsx"
          code={designSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={460}
        />
      </section>
    </Band>
  );
}

function Decision({ body, title }: { body: string; title: string }) {
  return (
    <article {...stylex.props(styles.decisionItem)}>
      <Icon icon="check" color="accent" size="sm" />
      <section {...stylex.props(styles.decisionCopy)}>
        <Heading level={3}>{title}</Heading>
        <Text as="p" display="block" color="secondary">
          {body}
        </Text>
      </section>
    </article>
  );
}

function Cli() {
  return (
    <Band id="cli">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="CLI"
            title="Rails-like generators for stable framework seams."
          >
            The <Code>ak</Code> CLI creates the repeated extension points a
            shell product needs. It intentionally stops before product routing,
            Cloudflare binding configuration, migrations, and deployment policy.
          </SectionHeader>
          <section {...stylex.props(styles.actionRow)} aria-label="CLI actions">
            <Button
              label="Command reference"
              href="#/build/cli-reference"
              variant="primary"
              icon={<Icon icon="chevronRight" size="sm" />}
            />
            <Button
              label="CLI source"
              href="https://github.com/thedjpetersen/astryxkit/tree/main/src/cli"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              icon={<Icon icon="externalLink" size="sm" />}
            />
          </section>
        </section>
        <CodeBlock
          title="ak"
          language="bash"
          code={generatorSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={520}
        />
      </section>
    </Band>
  );
}

function CliReference() {
  return (
    <Band id="cli-reference" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="CLI reference"
            title="The ak command surface is intentionally small."
          >
            The command parser accepts root help and version commands, a
            generator list command, and one write path: <Code>generate</Code> or
            <Code>g</Code>. Generator writes print stable action rows so output
            can be reviewed in CI logs.
          </SectionHeader>
          <SpecTable caption="Commands" rows={cliCommandRows} />
          <SpecTable caption="Options" rows={cliOptionRows} />
          <SpecTable caption="Result actions" rows={cliActionRows} />
        </section>
        <aside
          {...stylex.props(styles.codeStack)}
          aria-label="CLI reference examples"
        >
          <CodeBlock
            title="ak-reference"
            language="bash"
            code={cliReferenceSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={460}
          />
          <CodeBlock
            title="stdout"
            language="text"
            code={cliOutputSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
          />
        </aside>
      </section>
    </Band>
  );
}

function CliWorkflows() {
  return (
    <Band id="cli-workflows">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="CLI workflows"
            title="Generate framework seams in the order users will own them."
          >
            Start with shell wiring, add app manifests, then extract commands,
            preferences, Worker routes, and D1 repositories when those seams
            need tests or independent ownership.
          </SectionHeader>
          <SpecTable caption="Recommended workflow" rows={cliWorkflowRows} />
          <SpecTable caption="Naming and paths" rows={cliNamingRows} />
        </section>
        <CodeBlock
          title="scaffold-flow"
          language="bash"
          code={cliWorkflowSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={560}
        />
      </section>
    </Band>
  );
}

type GeneratorGuide = {
  after: string[];
  command: string;
  creates: string;
  inside: string[];
  kind: string;
  nameFormat: string;
};

const generatorGuides: GeneratorGuide[] = [
  {
    kind: "shell",
    command: "ak g shell Northstar",
    nameFormat: "<product-name>",
    creates: "src/shell/northstar.tsx",
    inside: [
      "A ShellHost configured with docs and preferences routes.",
      "A workspace object derived from the product name (name + slug).",
      "NorthstarShell: AstryxKitProvider wrapping ShellFrame wrapping ShellAppOutlet, with navigation delegated to host.navigate.",
    ],
    after: [
      "Render NorthstarShell from your entry module.",
      "Register app manifests on northstarHost with registerAll().",
      "Swap the default navigate for your router via ShellHostOptions.",
    ],
  },
  {
    kind: "app",
    command: "ak g app Catalog",
    nameFormat: "<app-name>",
    creates: "src/apps/catalog/index.tsx",
    inside: [
      "A full ShellAppManifest: id, route /app/catalog, entryUrl, icon, owner team.",
      "Two commands — Open Catalog (a page command) and Refresh Catalog, gated with when: \"appActive == 'catalog'\".",
      "A catalog.density enum preference with compact/comfortable/spacious options.",
      "activate() that binds the refresh handler through disposeWithApp and emits catalog.refreshed on the event bus.",
      "A starter Astryx surface whose buttons run real commands via host.runCommand.",
    ],
    after: [
      "host.register(catalogManifest) in your shell module.",
      "Point entryUrl at the production module URL your bundler emits.",
      "Replace the starter surface; keep the manifest contract.",
    ],
  },
  {
    kind: "command",
    command: "ak g command catalog.refresh",
    nameFormat: "<app-id>.<command-name>",
    creates: "src/commands/catalog/refresh.ts",
    inside: [
      "A namespaced CommandContribution, gated to its app with a when clause.",
      "bindRefreshCommand(context, handler): a binder that routes through disposeWithApp so the handler dies with the app.",
    ],
    after: [
      "Add the contribution to the manifest's commands array (declared early, palette-visible immediately).",
      "Call the binder inside activate() with the real handler.",
    ],
  },
  {
    kind: "preference",
    command: "ak g preference catalog.density",
    nameFormat: "<app-id>.<preference-name>",
    creates: "src/preferences/catalog/density.ts",
    inside: [
      "A namespaced PreferenceSchema — boolean, defaultValue true, labeled and categorized for settings UI.",
    ],
    after: [
      "Adjust type, options, and defaultValue to the real setting.",
      "Add it to the manifest's preferences array; the settings panel renders it from there.",
      "Read it with usePreferenceInspection or resolve it in plain code.",
    ],
  },
  {
    kind: "worker-route",
    command: "ak g worker-route catalog",
    nameFormat: "<route-name>",
    creates: "src/worker/routes/catalog.ts",
    inside: [
      "A GET WorkerRoute at /api/catalog answering through the shared json() helper.",
      "A typed Env alias ready to narrow to your real bindings.",
    ],
    after: [
      "Add the route to createWorkerRouter({ routes }).",
      "Tighten the Env type to the bindings the route actually uses.",
      "Grow methods and regex params as the API surface demands.",
    ],
  },
  {
    kind: "d1-repository",
    command: "ak g d1-repository customer",
    nameFormat: "<resource-name>",
    creates: "src/worker/repositories/customer-repository.ts",
    inside: [
      "A CustomerRecord type and createCustomerRepository(env, binding = \"DB\") built on requireD1Database.",
      "list/create/delete methods using prepared statements against a customer table (hyphenated names become underscores in SQL).",
    ],
    after: [
      "Write the migration yourself — schema design is deliberately not generated.",
      "Extend the record type and queries to the real resource.",
      "Wire the repository into Worker routes.",
    ],
  },
];

function Generators() {
  return (
    <Band id="generators" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Generators"
            title="Generate the next correct file, not an entire product."
          >
            Generators create typed first drafts around framework concepts. The
            output is meant to be read, edited, committed, and owned by the host
            application.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              Generated files are guarded by default: an existing target aborts
              with an error naming the file, <Code>--dry-run</Code> prints the
              create/skip plan without writing, <Code>--dir</Code> moves the
              output root, <Code>--force</Code> makes an overwrite intentional,
              and every write is confined to the working directory.
            </Text>
          </section>
        </section>
        <SpecTable caption="Generator outputs" rows={generatorRows} />
      </section>
      <section
        {...stylex.props(styles.generatorGuideList)}
        aria-label="Generator deep dive"
      >
        {generatorGuides.map((guide) => (
          <article key={guide.kind} {...stylex.props(styles.generatorGuideCard)}>
            <header {...stylex.props(styles.generatorGuideHead)}>
              <HStack gap={2} align="center" wrap="wrap">
                <Badge variant="blue" label={guide.kind} />
                <Code>{guide.command}</Code>
              </HStack>
              <Text type="supporting" color="secondary">
                {guide.nameFormat}
              </Text>
            </header>
            <section {...stylex.props(styles.generatorGuideBody)}>
              <section {...stylex.props(styles.generatorGuideCol)}>
                <Text type="label" weight="semibold">
                  Creates
                </Text>
                <Code>{guide.creates}</Code>
              </section>
              <section {...stylex.props(styles.generatorGuideCol)}>
                <Text type="label" weight="semibold">
                  Inside
                </Text>
                <ul {...stylex.props(styles.generatorGuideItems)}>
                  {guide.inside.map((item) => (
                    <li key={item}>
                      <Text as="p" display="block" type="supporting" color="secondary">
                        {item}
                      </Text>
                    </li>
                  ))}
                </ul>
              </section>
              <section {...stylex.props(styles.generatorGuideCol)}>
                <Text type="label" weight="semibold">
                  Then
                </Text>
                <ul {...stylex.props(styles.generatorGuideItems)}>
                  {guide.after.map((item) => (
                    <li key={item}>
                      <Text as="p" display="block" type="supporting" color="secondary">
                        {item}
                      </Text>
                    </li>
                  ))}
                </ul>
              </section>
            </section>
          </article>
        ))}
      </section>
    </Band>
  );
}

function GeneratedContracts() {
  return (
    <Band id="generated-contracts">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Generated contracts"
            title="Generated files are starting contracts, not hidden architecture."
          >
            Each generator creates the smallest useful file at a stable
            framework boundary. Product decisions should be filled in after
            generation rather than encoded into the generator.
          </SectionHeader>
          <SpecTable
            caption="Generator file contracts"
            rows={generatedContractRows}
          />
        </section>
        <CodeBlock
          title="generated-command.ts"
          language="ts"
          code={generatedContractSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={520}
        />
      </section>
    </Band>
  );
}

function Workers() {
  return (
    <Band id="workers">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Workers"
            title="Worker helpers stay small so infrastructure stays honest."
          >
            AstryxKit provides request-boundary helpers, not a platform
            abstraction. Host apps still own bindings, schema, migrations,
            deployment topology, limits, and product-specific data access.
          </SectionHeader>
          <SpecTable caption="Worker helper reference" rows={workerRows} />
          <section {...stylex.props(styles.linkPanel)}>
            <Heading level={3}>Current Cloudflare references</Heading>
            <LinkList links={cloudflareLinks} />
          </section>
        </section>
        <aside {...stylex.props(styles.codeStack)} aria-label="Worker examples">
          <CodeBlock
            title="worker.ts"
            language="ts"
            code={workerSnippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={420}
          />
          <CodeBlock
            title="customer-repository.ts"
            language="ts"
            code={d1Snippet}
            width="100%"
            xstyle={styles.codeBlockStripe}
            isWrapped
            hasLineNumbers
            maxHeight={560}
          />
        </aside>
      </section>
    </Band>
  );
}

function ExportMap() {
  return (
    <Band id="export-map" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Export map"
            title="Choose imports by ownership boundary."
          >
            The package entrypoints are deliberately narrow. Use the entrypoint
            that matches the layer you are editing so runtime code, UI code,
            design wrapper code, and Worker helpers stay easy to audit.
          </SectionHeader>
          <SpecTable caption="Package entrypoints" rows={exportRows} />
        </section>
        <CodeBlock
          title="imports.ts"
          language="ts"
          code={exportMapSnippet}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
          hasLineNumbers
          maxHeight={460}
        />
      </section>
    </Band>
  );
}

function Troubleshooting() {
  return (
    <Band id="troubleshooting">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Troubleshooting"
            title="Most integration failures are boundary mismatches."
          >
            Start with the contract that owns the failing behavior: app
            registration for rendering, command declarations for palette work,
            context keys for visibility, preference schemas for settings, and
            Worker routes for edge requests.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              The runtime fails loudly for unknown commands, duplicate
              manifests, invalid preference values, second shell instances, and
              missing D1 bindings so the fix lands at the owning boundary.
            </Text>
          </section>
        </section>
        <SpecTable caption="Common symptoms" rows={troubleshootingRows} />
      </section>
    </Band>
  );
}

function Reference() {
  return (
    <Band id="reference" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Reference"
            title="The public API mirrors product ownership boundaries."
          >
            The reference is intentionally short. The framework surface should
            make product seams clearer: shell runtime, app modules, React UI,
            design wrapper, and Worker helpers.
          </SectionHeader>
          <section {...stylex.props(styles.linkPanel)}>
            <Heading level={3}>Repository docs</Heading>
            <Text as="p" display="block" color="secondary">
              The markdown docs carry implementation rationale and repo-specific
              notes that should stay close to source changes.
            </Text>
            <LinkList links={docLinks} />
          </section>
        </section>
        <SpecTable caption="Core API map" rows={apiRows} />
      </section>
    </Band>
  );
}

function ShipChecklist() {
  return (
    <Band id="ship">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader
            badge="Ship"
            title="What to verify before publishing a shell product."
          >
            The framework is intentionally explicit, so the release checklist is
            explicit too. Validate the package, inspect generated files, and
            confirm external platform assumptions before deployment.
          </SectionHeader>
          <ol {...stylex.props(styles.stepRail)}>
            <Step
              index="01"
              title="Run validation"
              body="Use npm run validate to typecheck, test, build the package, and build the docs site."
            />
            <Step
              index="02"
              title="Verify the registry package"
              body="Check npm metadata and run the published CLI from a clean install before announcing a release."
            />
            <Step
              index="03"
              title="Check UI composition"
              body="Verify no raw div elements or inline style props enter UI code, and inspect responsive docs screenshots."
            />
            <Step
              index="04"
              title="Re-check Cloudflare docs"
              body="Before changing Workers, D1, KV, R2, Durable Objects, Queues, Vectorize, Workers AI, or Agents SDK behavior, retrieve current product docs and limits."
            />
          </ol>
        </section>
        <CodeBlock
          title="release-checks.sh"
          language="bash"
          code={`npm run validate
npm view astryxkit version dist-tags bin --json
npx astryxkit@latest --version
npm run docs:screenshot
git status --short
gh run list --workflow Docs --limit 3`}
          width="100%"
          xstyle={styles.codeBlockStripe}
          isWrapped
        />
      </section>
    </Band>
  );
}

function SpecTable({ caption, rows }: { caption: string; rows: SpecRow[] }) {
  return (
    <section {...stylex.props(styles.tableFrame)}>
      <Text
        type="label"
        weight="semibold"
        display="block"
        xstyle={styles.tableCaption}
      >
        {caption}
      </Text>
      <ul {...stylex.props(styles.specList)}>
        {rows.map((row) => (
          <li key={`${row.name}:${row.tag}`} {...stylex.props(styles.specItem)}>
            <span {...stylex.props(styles.specItemHead)}>
              <Code>{row.name}</Code>
              <Badge variant={row.tagVariant ?? "neutral"} label={row.tag} />
            </span>
            <Text as="p" display="block" color="secondary">
              {row.detail}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LinkList({ links }: { links: LinkRow[] }) {
  return (
    <ul {...stylex.props(styles.linkList)}>
      {links.map((link) => (
        <li key={link.href} {...stylex.props(styles.linkItem)}>
          <Link href={link.href} target="_blank" rel="noreferrer" isStandalone>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CodeBlock(props: CodeListingProps) {
  return <CodeListing {...props} />;
}

function isDocsPageId(value: string): value is DocsPageId {
  return Object.prototype.hasOwnProperty.call(docsPages, value);
}

function getDefaultSectionId(pageId: DocsPageId) {
  return docsPages[pageId].sectionIds[0];
}

function normalizeHashPart(value: string | undefined) {
  if (!value) {
    return "";
  }

  const part = value.split("?")[0] ?? "";

  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

function parseDocsRoute(hash: string): DocsRoute {
  const routeValue = hash.replace(/^#\/?/, "");
  const [firstPart, secondPart] = routeValue.split("/");
  const first = normalizeHashPart(firstPart);
  const second = normalizeHashPart(secondPart);

  if (isDocsPageId(first)) {
    const section = docsSectionById.get(second);

    if (section && section.pageId === first) {
      return { pageId: first, sectionId: section.id };
    }

    if (section) {
      return { pageId: section.pageId, sectionId: section.id };
    }

    return { pageId: first };
  }

  const legacySection = docsSectionById.get(first);

  if (legacySection) {
    return { pageId: legacySection.pageId, sectionId: legacySection.id };
  }

  return { pageId: "overview" };
}

function useDocsRoute() {
  const [route, setRoute] = useState<DocsRoute>(() =>
    typeof window === "undefined"
      ? { pageId: "overview" }
      : parseDocsRoute(window.location.hash),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onHashChange = () => {
      setRoute(parseDocsRoute(window.location.hash));
    };

    onHashChange();
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return route;
}

function useDocsRouteScroll(route: DocsRoute) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const targetId = route.sectionId ?? getDefaultSectionId(route.pageId);
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }

      window.scrollTo({ top: 0 });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [route.pageId, route.sectionId]);
}

function useActiveDocsSection(sectionIds: string[], routeSectionId?: string) {
  const [activeSection, setActiveSection] = useState(
    routeSectionId ?? sectionIds[0],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setActiveSection(routeSectionId ?? sectionIds[0]);
  }, [routeSectionId, sectionIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let animationFrame = 0;

    const updateFromScroll = () => {
      const visibleSection =
        sectionIds.findLast((id) => {
          const element = document.getElementById(id);

          return element ? element.getBoundingClientRect().top <= 140 : false;
        }) ?? sectionIds[0];

      setActiveSection(visibleSection);
    };

    const requestScrollUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateFromScroll);
    };

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                  (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
                );
              const visibleEntry = visibleEntries[0];

              if (visibleEntry?.target.id) {
                setActiveSection(visibleEntry.target.id);
              }
            },
            {
              rootMargin: "-100px 0% -60% 0%",
              threshold: 0,
            },
          )
        : undefined;

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        observer?.observe(element);
      }
    });

    updateFromScroll();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestScrollUpdate);
      observer?.disconnect();
    };
  }, [sectionIds]);

  return activeSection;
}

function useDocsSearchShortcut(onSearchQueryChange: (query: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.key === "/" &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey) ||
        (event.key.toLowerCase() === "k" && event.metaKey && !event.ctrlKey);

      if (isSearchShortcut && !isTypingTarget(event.target)) {
        const input = document.querySelector<HTMLInputElement>(
          'input[name="docsSearch"]',
        );

        if (input && input.offsetParent) {
          event.preventDefault();
          input.focus();
        }
      }

      if (
        event.key === "Escape" &&
        event.target instanceof HTMLInputElement &&
        event.target.name === "docsSearch"
      ) {
        onSearchQueryChange("");
        event.target.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onSearchQueryChange]);
}

function DocsPage({
  pageId,
  sectionId,
}: {
  pageId: DocsPageId;
  sectionId?: string;
}) {
  switch (pageId) {
    case "source": {
      const module =
        (sectionId ? sourceModuleById.get(sectionId) : undefined) ??
        sourceModules[0];

      return <AnnotatedSource key={module.id} module={module} />;
    }
    case "overview":
      return (
        <>
          <DocsHero />
          <FrameworkMap />
          <ArchitectureModel />
        </>
      );
    case "motivation":
      return <Motivation />;
    case "quickstart":
      return (
        <>
          <Install />
          <Quickstart />
          <ProjectLayout />
        </>
      );
    case "runtime":
      return (
        <>
          <ManifestContract />
          <RuntimeLifecycle />
          <ActivationContext />
          <Commands />
          <Preferences />
          <RuntimeState />
          <WorkspaceEntities />
          <ReactShell />
          <DesignSystem />
        </>
      );
    case "build":
      return (
        <>
          <Cli />
          <CliReference />
          <CliWorkflows />
          <Generators />
          <GeneratedContracts />
        </>
      );
    case "reference":
      return (
        <>
          <Workers />
          <ExportMap />
          <Troubleshooting />
          <Reference />
          <ShipChecklist />
        </>
      );
    default:
      return null;
  }
}

export function DocsApp() {
  const route = useDocsRoute();
  const activeSection = useActiveDocsSection(
    docsPages[route.pageId].sectionIds,
    route.sectionId,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useDocsRouteScroll(route);
  useDocsSearchShortcut(setSearchQuery);

  return (
    <AstryxKitProvider appearance="system" theme={docsTheme}>
      <AppShell
        xstyle={styles.docsShell}
        height="auto"
        variant="section"
        contentPadding={0}
        topNav={
          <TopNavigation
            activePage={route.pageId}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        }
        sideNav={<SideNavigation activeSection={activeSection} />}
      >
        <DocsPage pageId={route.pageId} sectionId={route.sectionId} />
      </AppShell>
    </AstryxKitProvider>
  );
}

const styles = stylex.create({
  docsShell: {
    backgroundColor: colorVars["--color-background-body"],
  },
  topNavStripe: {
    backgroundColor: colorVars["--color-background-surface"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
  },
  sideNavStripe: {
    backgroundColor: colorVars["--color-background-body"],
    borderInlineEndColor: colorVars["--color-border"],
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: borderVars["--border-width"],
  },
  topNavActions: {
    alignItems: "center",
    display: "flex",
    gap: spacingVars["--spacing-2"],
    minWidth: 0,
  },
  quickFind: {
    display: {
      default: "none",
      "@media (min-width: 980px)": "block",
    },
    minWidth: 0,
    position: "relative",
    width: "min(34vw, 360px)",
    zIndex: 20,
  },
  quickFindResults: {
    backgroundColor: colorVars["--color-background-popover"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-med"],
    insetInlineEnd: 0,
    insetInlineStart: 0,
    maxHeight: "min(60vh, 360px)",
    overflowY: "auto",
    position: "absolute",
    top: `calc(100% + ${spacingVars["--spacing-2"]})`,
  },
  quickFindList: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: spacingVars["--spacing-2"],
  },
  quickFindItem: {
    borderRadius: radiusVars["--radius-inner"],
    display: "grid",
    gap: spacingVars["--spacing-1"],
    paddingBlock: spacingVars["--spacing-2"],
    paddingInline: spacingVars["--spacing-3"],
    ":hover": {
      backgroundColor: colorVars["--color-overlay-hover"],
    },
    ":focus-within": {
      backgroundColor: colorVars["--color-overlay-hover"],
    },
  },
  quickFindEmpty: {
    padding: spacingVars["--spacing-4"],
  },
  heroBand: {
    backgroundColor: colorVars["--color-background-surface"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-10"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
    scrollMarginTop: `calc(${spacingVars["--spacing-12"]} + ${spacingVars["--spacing-8"]})`,
  },
  hero: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1080px)": "minmax(0, 1fr) minmax(420px, 0.9fr)",
    },
    marginInline: "auto",
    maxWidth: 1320,
    width: "100%",
  },
  heroCopy: {
    alignContent: "center",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    minWidth: 0,
  },
  actionRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
  },
  systemFrame: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
    minWidth: 0,
    overflow: "hidden",
  },
  systemHeader: {
    alignItems: "center",
    backgroundColor: colorVars["--color-background-muted"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  statusDot: {
    backgroundColor: colorVars["--color-success"],
    borderRadius: radiusVars["--radius-full"],
    display: "inline-block",
    height: spacingVars["--spacing-2"],
    width: spacingVars["--spacing-2"],
  },
  systemBody: {
    display: "grid",
  },
  systemRow: {
    alignItems: "start",
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "auto minmax(0, 1fr)",
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  systemRowCopy: {
    display: "grid",
    gap: spacingVars["--spacing-1"],
    minWidth: 0,
  },
  metricStrip: {
    borderTopColor: colorVars["--color-border"],
    borderTopStyle: "solid",
    borderTopWidth: borderVars["--border-width"],
    display: "grid",
    gap: 0,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  metric: {
    borderInlineEndColor: colorVars["--color-border"],
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  band: {
    backgroundColor: colorVars["--color-background-surface"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-10"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
    scrollMarginTop: `calc(${spacingVars["--spacing-12"]} + ${spacingVars["--spacing-8"]})`,
  },
  bandMuted: {
    backgroundColor: colorVars["--color-background-body"],
  },
  bandInner: {
    display: "grid",
    gap: spacingVars["--spacing-6"],
    marginInline: "auto",
    maxWidth: 1320,
    width: "100%",
  },
  sectionHeader: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    maxWidth: 760,
  },
  motivationProse: {
    display: "grid",
    gap: spacingVars["--spacing-6"],
    marginInline: "auto",
    maxWidth: 760,
    width: "100%",
  },
  installStrip: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 980px)": "minmax(0, 1fr) minmax(420px, 560px)",
    },
  },
  guideGrid: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1240px)": "minmax(0, 1fr) minmax(430px, 560px)",
    },
  },
  referenceSplit: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1240px)": "minmax(0, 1fr) minmax(420px, 560px)",
    },
  },
  copyBlock: {
    display: "grid",
    gap: spacingVars["--spacing-5"],
    minWidth: 0,
  },
  codeStack: {
    display: "grid",
    gap: spacingVars["--spacing-4"],
    minWidth: 0,
  },
  codeBlockStripe: {
    borderColor: "#1a2652",
    borderRadius: radiusVars["--radius-inner"],
    boxShadow: shadowVars["--shadow-med"],
  },
  notePanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    padding: spacingVars["--spacing-4"],
  },
  packageMetaPanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    padding: spacingVars["--spacing-4"],
  },
  surfaceGrid: {
    display: "grid",
    gap: spacingVars["--spacing-4"],
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  },
  surfaceGridCompact: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  },
  surfacePanel: {
    alignContent: "start",
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    minHeight: 0,
    padding: spacingVars["--spacing-4"],
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    gap: spacingVars["--spacing-2"],
    justifyContent: "space-between",
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colorVars["--color-background-muted"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "inline-flex",
    height: spacingVars["--spacing-8"],
    justifyContent: "center",
    width: spacingVars["--spacing-8"],
  },
  stepRail: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  stepItem: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "auto minmax(0, 1fr)",
    padding: spacingVars["--spacing-4"],
  },
  stepIndex: {
    alignItems: "center",
    backgroundColor: "#556cd6",
    borderRadius: radiusVars["--radius-inner"],
    color: colorVars["--color-on-dark"],
    display: "inline-flex",
    fontFamily: typographyVars["--font-family-code"],
    height: spacingVars["--spacing-8"],
    justifyContent: "center",
    width: spacingVars["--spacing-8"],
  },
  stepCopy: {
    display: "grid",
    gap: spacingVars["--spacing-1"],
    minWidth: 0,
  },
  layerStack: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  layerItem: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-1"],
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  interactivePanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
    display: "grid",
    gap: spacingVars["--spacing-5"],
    padding: spacingVars["--spacing-5"],
  },
  interactiveHeader: {
    alignItems: "start",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-3"],
    justifyContent: "space-between",
  },
  interactiveTitle: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    maxWidth: 680,
    minWidth: 0,
  },
  commandControls: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
  },
  modeButtons: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
  },
  resultList: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  resultItem: {
    minWidth: 0,
  },
  resultCard: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "auto minmax(0, 1fr)",
    padding: spacingVars["--spacing-4"],
  },
  resultRank: {
    alignItems: "center",
    backgroundColor: colorVars["--color-background-muted"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "inline-flex",
    height: spacingVars["--spacing-8"],
    justifyContent: "center",
    width: spacingVars["--spacing-8"],
  },
  resultCopy: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    minWidth: 0,
  },
  resultHeader: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
  },
  resultMeta: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
  },
  emptyResult: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    listStyle: "none",
    padding: spacingVars["--spacing-4"],
  },
  prefLabGrid: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-5"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1100px)": "minmax(0, 1.4fr) minmax(280px, 1fr)",
    },
  },
  prefCascade: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  prefRow: {
    alignItems: "start",
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 760px)": "minmax(0, 1fr) auto",
    },
    padding: spacingVars["--spacing-3"],
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionProperty: "border-color, box-shadow",
  },
  prefRowWin: {
    borderColor: colorVars["--color-success"],
    boxShadow: "0 0 0 1px " + "rgba(13, 134, 38, 0.35)",
  },
  prefRowMain: {
    display: "grid",
    gap: spacingVars["--spacing-1"],
    minWidth: 0,
  },
  prefReadout: {
    backgroundColor: colorVars["--color-background-muted"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    padding: spacingVars["--spacing-4"],
  },
  generatorGuideList: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
  },
  generatorGuideCard: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
    display: "grid",
    gap: spacingVars["--spacing-4"],
    padding: spacingVars["--spacing-4"],
  },
  generatorGuideHead: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-3"],
    justifyContent: "space-between",
  },
  generatorGuideBody: {
    display: "grid",
    gap: spacingVars["--spacing-4"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 980px)": "minmax(180px, 0.7fr) minmax(0, 1.3fr) minmax(0, 1.1fr)",
    },
  },
  generatorGuideCol: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    justifyItems: "start",
    minWidth: 0,
  },
  generatorGuideItems: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  decisionList: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
  },
  decisionItem: {
    alignItems: "start",
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "auto minmax(0, 1fr)",
    padding: spacingVars["--spacing-4"],
  },
  decisionCopy: {
    display: "grid",
    gap: spacingVars["--spacing-1"],
    minWidth: 0,
  },
  tableFrame: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
    minWidth: 0,
    overflowX: "auto",
  },
  tableCaption: {
    backgroundColor: colorVars["--color-background-muted"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  specList: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  specItem: {
    borderBottomColor: {
      default: colorVars["--color-border"],
      ":last-child": "transparent",
    },
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-1"],
    justifyItems: "start",
    minWidth: 0,
    overflowWrap: "anywhere",
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  specItemHead: {
    alignItems: "center",
    columnGap: spacingVars["--spacing-2"],
    display: "flex",
    flexWrap: "wrap",
    rowGap: spacingVars["--spacing-1"],
  },
  linkPanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-inner"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    padding: spacingVars["--spacing-5"],
  },
  linkList: {
    display: "grid",
    gap: spacingVars["--spacing-2"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  linkItem: {
    borderTopColor: colorVars["--color-border"],
    borderTopStyle: "solid",
    borderTopWidth: borderVars["--border-width"],
    paddingBlockStart: spacingVars["--spacing-2"],
  },
});
