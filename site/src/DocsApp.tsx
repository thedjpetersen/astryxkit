import {
  AppShell,
  Badge,
  Button,
  Code,
  CodeBlock,
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
import { useMemo, useState, type ReactNode } from "react";
import { AstryxKitProvider } from "../../src/design-system";

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

const installSnippet = `npm install astryxkit \\
  @astryxdesign/core @stylexjs/stylex \\
  react react-dom`;

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

useCommandSource({
  host,
  source: {
    id: "catalog:bulk-actions",
    appId: "catalog",
    label: "Catalog bulk actions",
    ring: "feature",
    commands,
  },
});`;

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

const packageSurfaces: Surface[] = [
  {
    body: "The framework boundary for app registration, activation, command routing, context keys, preferences, events, and import maps.",
    code: "astryxkit/core",
    eyebrow: "Runtime",
    href: "#lifecycle",
    icon: "wrench",
    title: "Shell runtime",
  },
  {
    body: "The React integration for the shell frame, active app outlet, command palette, preferences panel, and host-state hooks.",
    code: "astryxkit/react",
    eyebrow: "Interface",
    href: "#react",
    icon: "viewColumns",
    title: "React shell",
  },
  {
    body: "The Astryx provider wrapper and appearance persistence layer. Use Astryx controls, then compose custom surfaces with StyleX.",
    code: "astryxkit/design-system",
    eyebrow: "Design",
    href: "#design-system",
    icon: "checkDouble",
    title: "Design system",
  },
  {
    body: "Small helpers for JSON responses, request parsing, route composition, asset fallback, health checks, and D1 access.",
    code: "astryxkit/worker",
    eyebrow: "Edge",
    href: "#workers",
    icon: "externalLink",
    title: "Worker boundary",
  },
];

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
    description: "Open the shared preference inspector for platform, product, app, and feature settings.",
    id: "platform.openPreferences",
    kind: "page",
    keywords: ["settings", "configuration", "preferences"],
    ring: "platform",
    shortcut: "Meta ,",
    title: "Open Preferences",
  },
  {
    description: "Open the product documentation surface from anywhere in the shell.",
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
    title: "Refresh Catalog",
    when: "appActive == 'catalog'",
  },
  {
    description: "Archive every selected catalog item through a feature-scoped command source.",
    id: "catalog.bulkArchive",
    kind: "action",
    keywords: ["bulk", "archive", "selected"],
    ring: "feature",
    title: "Archive Selected Items",
    when: "catalog.selectionCount != 0",
  },
  {
    description: "Jump directly to the customer entity that owns the selected catalog item.",
    id: "catalog.customer",
    kind: "entity",
    keywords: ["customer", "owner", "account"],
    ring: "app",
    title: "Customer Entity",
  },
  {
    description: "Explain how Catalog commands are registered, filtered, and activated.",
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

const generatorRows: SpecRow[] = [
  {
    detail: "Creates product-level ShellHost, AstryxKitProvider, ShellFrame, and ShellAppOutlet wiring.",
    name: "ak g shell <product>",
    tag: "src/shell",
    tagVariant: "blue",
  },
  {
    detail: "Creates a manifest, activation function, default open/refresh commands, sample preference, and first view.",
    name: "ak g app <name>",
    tag: "src/apps",
    tagVariant: "teal",
  },
  {
    detail: "Creates a typed CommandContribution and binder that is safe to attach during app activation.",
    name: "ak g command <app>.<name>",
    tag: "src/commands",
    tagVariant: "purple",
  },
  {
    detail: "Creates a PreferenceSchema with namespaced key, category, label, type, and default value.",
    name: "ak g preference <app>.<name>",
    tag: "src/preferences",
    tagVariant: "green",
  },
  {
    detail: "Creates a WorkerRoute module around explicit request context and JSON response helpers.",
    name: "ak g worker-route <name>",
    tag: "src/worker/routes",
    tagVariant: "orange",
  },
  {
    detail: "Creates a typed D1 repository wrapper around binding lookup, prepared statements, and batch helpers.",
    name: "ak g d1-repository <name>",
    tag: "src/worker/repositories",
    tagVariant: "cyan",
  },
];

const apiRows: SpecRow[] = [
  {
    detail: "Registers manifests, activates micro-app modules, exposes palette/settings/events state, and owns navigation.",
    name: "ShellHost",
    tag: "core",
    tagVariant: "blue",
  },
  {
    detail: "The contract for route, owner, commands, preferences, features, entry URL, and lazy app loader.",
    name: "ShellAppManifest",
    tag: "core",
    tagVariant: "teal",
  },
  {
    detail: "The lower-level registry, context, event bus, and preferences services used by ShellHost.",
    name: "ShellSDK",
    tag: "core",
    tagVariant: "purple",
  },
  {
    detail: "Ranks palette results by command ring, prefix mode, text score, context expression, and recency.",
    name: "CommandRegistry",
    tag: "core",
    tagVariant: "green",
  },
  {
    detail: "Resolves platform, product, app, feature, user, and default layers while preserving inspection metadata.",
    name: "PreferencesStore",
    tag: "core",
    tagVariant: "orange",
  },
  {
    detail: "Renders the Astryx AppShell, top navigation, side app navigation, command trigger, and child outlet.",
    name: "ShellFrame",
    tag: "react",
    tagVariant: "teal",
  },
  {
    detail: "Activates the target app and renders its instance through the active route and workspace context.",
    name: "ShellAppOutlet",
    tag: "react",
    tagVariant: "purple",
  },
  {
    detail: "Builds a compact Worker fetch handler from explicit routes, health check, asset fallback, and not-found handling.",
    name: "createWorkerRouter",
    tag: "worker",
    tagVariant: "green",
  },
];

const workerRows: SpecRow[] = [
  {
    detail: "Returns JSON with the correct content type and an explicit ResponseInit boundary.",
    name: "json",
    tag: "HTTP",
    tagVariant: "blue",
  },
  {
    detail: "Parses request JSON defensively and returns an empty object for malformed or non-object bodies.",
    name: "readJsonObject",
    tag: "HTTP",
    tagVariant: "teal",
  },
  {
    detail: "Matches exact strings or regular expressions and passes URL, params, env, ctx, and request to handlers.",
    name: "WorkerRoute",
    tag: "Routing",
    tagVariant: "purple",
  },
  {
    detail: "Guards D1 binding lookup so missing or misnamed bindings fail at the repository boundary.",
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

function TopNavigation() {
  return (
    <TopNav
      label="AstryxKit documentation"
      heading={
        <TopNavHeading
          logo={<Icon icon="wrench" color="accent" />}
          heading="AstryxKit"
          subheading="Framework docs"
          headingHref="#overview"
        />
      }
      startContent={
        <>
          <TopNavItem label="Overview" href="#overview" isSelected />
          <TopNavItem label="Quickstart" href="#quickstart" />
          <TopNavItem label="Runtime" href="#lifecycle" />
          <TopNavItem label="CLI" href="#cli" />
          <TopNavItem label="Reference" href="#reference" />
        </>
      }
      endContent={
        <Button
          label="GitHub"
          href="https://github.com/thedjpetersen/astryxkit"
          target="_blank"
          rel="noreferrer"
          variant="ghost"
          icon={<Icon icon="externalLink" size="sm" />}
        />
      }
    />
  );
}

function SideNavigation() {
  return (
    <SideNav>
      <SideNavSection title="Start">
        <SideNavItem label="Overview" href="#overview" icon="info" isSelected />
        <SideNavItem label="Install" href="#install" icon="copy" />
        <SideNavItem label="Quickstart" href="#quickstart" icon="chevronRight" />
      </SideNavSection>
      <SideNavSection title="Concepts">
        <SideNavItem label="Framework map" href="#framework-map" icon="viewColumns" />
        <SideNavItem label="Runtime lifecycle" href="#lifecycle" icon="clock" />
        <SideNavItem label="Commands" href="#commands" icon="search" />
        <SideNavItem label="Preferences" href="#preferences" icon="wrench" />
        <SideNavItem label="React shell" href="#react" icon="menu" />
        <SideNavItem label="Design system" href="#design-system" icon="checkDouble" />
      </SideNavSection>
      <SideNavSection title="Build">
        <SideNavItem label="CLI" href="#cli" icon="menu" />
        <SideNavItem label="Generators" href="#generators" icon="copy" />
        <SideNavItem label="Workers" href="#workers" icon="externalLink" />
        <SideNavItem label="API reference" href="#reference" icon="check" />
        <SideNavItem label="Ship checklist" href="#ship" icon="success" />
      </SideNavSection>
    </SideNav>
  );
}

function DocsHero() {
  return (
    <section id="overview" {...stylex.props(styles.heroBand)}>
      <article {...stylex.props(styles.hero)}>
        <section {...stylex.props(styles.heroCopy)} aria-labelledby="hero-title">
          <HStack gap={2} wrap="wrap">
            <Badge variant="neutral" label="Micro-app shell" />
            <Badge variant="neutral" label="Command runtime" />
            <Badge variant="neutral" label="Worker boundary" />
          </HStack>
          <VStack gap={4}>
            <Heading level={1} type="display-2" id="hero-title">
              The framework layer for Astryx products that need to scale past one app.
            </Heading>
            <Text as="p" type="large" display="block" color="secondary">
              AstryxKit gives host products a shared shell runtime, React frame,
              command palette, layered preferences, design-system contract, and
              compact Cloudflare Worker helpers without taking ownership of
              product routes or infrastructure.
            </Text>
          </VStack>
          <section {...stylex.props(styles.actionRow)} aria-label="Primary actions">
            <Button
              label="Start quickstart"
              href="#quickstart"
              variant="primary"
              icon={<Icon icon="chevronRight" size="sm" />}
            />
            <Button
              label="Browse reference"
              href="#reference"
              variant="secondary"
              icon={<Icon icon="search" size="sm" />}
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

        <aside {...stylex.props(styles.systemFrame)} aria-label="AstryxKit system map">
          <header {...stylex.props(styles.systemHeader)}>
            <HStack gap={1.5} align="center">
              <span {...stylex.props(styles.statusDot)} />
              <Text type="supporting" color="secondary">
                framework map
              </Text>
            </HStack>
            <Code>astryxkit@0.1.0</Code>
          </header>
          <section {...stylex.props(styles.systemBody)}>
            {packageSurfaces.map((surface) => (
              <SystemRow key={surface.title} surface={surface} />
            ))}
          </section>
          <footer {...stylex.props(styles.metricStrip)}>
            <Metric label="exports" value="4" />
            <Metric label="generators" value="6" />
            <Metric label="tests" value="22" />
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
          <SectionHeader badge="Install" title="Install the framework, keep peers explicit.">
            AstryxKit depends on the host product for React, Astryx Core, and
            StyleX. That keeps product shells aligned with the application
            runtime they already own.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              Use the framework exports directly in product code. The short
              <Code>ak</Code> binary is for scaffolding files; runtime imports
              stay package-scoped so module boundaries remain obvious.
            </Text>
          </section>
        </section>
        <CodeBlock
          title="terminal"
          language="bash"
          code={installSnippet}
          width="100%"
          isWrapped
        />
      </section>
    </Band>
  );
}

function Quickstart() {
  return (
    <Band id="quickstart" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="Quickstart" title="Create a shell, register an app, render the outlet.">
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
            isWrapped
            maxHeight={620}
            highlightLines={[4, 5, 10, 15]}
          />
          <CodeBlock
            title="manifest.ts"
            language="ts"
            code={manifestSnippet}
            width="100%"
            isWrapped
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
      <SectionHeader badge="Framework map" title="Four package surfaces, one product contract.">
        Each export maps to a stable ownership boundary. The runtime is not a
        page builder; it is the contract that lets independently owned app
        modules behave like one product.
      </SectionHeader>
      <section {...stylex.props(styles.surfaceGrid)}>
        {packageSurfaces.map((surface) => (
          <SurfacePanel key={surface.title} surface={surface} />
        ))}
      </section>
    </Band>
  );
}

function RuntimeLifecycle() {
  return (
    <Band id="lifecycle" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="Runtime" title="The host lifecycle is explicit by design.">
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
          isWrapped
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
          <SectionHeader badge="Commands" title="Commands are the framework extension point.">
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
                detail: "Filters to action commands such as refresh, save, rebuild, or approve.",
              },
              {
                name: "/",
                tag: "Pages",
                tagVariant: "teal",
                detail: "Filters to route or href commands for navigation surfaces.",
              },
              {
                name: "@",
                tag: "Entities",
                tagVariant: "purple",
                detail: "Filters to entity commands for records, people, accounts, or other addressable objects.",
              },
              {
                name: "?",
                tag: "Help",
                tagVariant: "green",
                detail: "Filters help-oriented commands and documentation entries.",
              },
            ]}
          />
        </section>
        <CodeBlock
          title="command.ts"
          language="ts"
          code={commandSnippet}
          width="100%"
          isWrapped
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
    <section {...stylex.props(styles.interactivePanel)} aria-labelledby="command-lab-title">
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
        <section {...stylex.props(styles.modeButtons)} aria-label="Command prefix modes">
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
                      <Text type="supporting" color="secondary" hasTabularNumbers>
                        score {command.score}
                      </Text>
                    </HStack>
                  </header>
                  <Text as="p" display="block" color="secondary">
                    {command.description}
                  </Text>
                  {command.when || command.shortcut ? (
                    <footer {...stylex.props(styles.resultMeta)}>
                      {command.when ? <Code>{command.when}</Code> : null}
                      {command.shortcut ? <Code>{command.shortcut}</Code> : null}
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

function rankDemoCommands(query: string, modeId: CommandModeId): RankedDemoCommand[] {
  const mode = commandModes.find((item) => item.id === modeId);
  const parsed = parseCommandQuery(query);
  const normalizedQuery = parsed.query;
  const activeKind = parsed.kind ?? mode?.kind;

  return demoCommands
    .filter((command) => (activeKind ? command.kind === activeKind : true))
    .map((command) => {
      const baseScore =
        ringWeights[command.ring] + kindWeights[command.kind] + (command.when ? 1 : 0);
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

function parseCommandQuery(query: string): { kind?: CommandKind; query: string } {
  const trimmed = query.trimStart();
  const mode = commandModes.find((item) => item.prefix && trimmed.startsWith(item.prefix));

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
  let score = 0;

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
          <SectionHeader badge="Preferences" title="Preference resolution is layered, inspectable, and reversible.">
            Preferences resolve through scoped records instead of ad hoc product
            state. The store preserves where a value came from, whether it was
            inherited, and whether a user override exists.
          </SectionHeader>
          <ol {...stylex.props(styles.layerStack)}>
            <Layer label="Feature" body="Highest seed scope for feature-specific defaults when a feature context is active." />
            <Layer label="App" body="Application-level defaults and user overrides for a micro-app." />
            <Layer label="Product" body="Host-product defaults shared across registered apps." />
            <Layer label="Platform" body="Platform-wide defaults keyed by platformId." />
            <Layer label="Default" body="Schema defaultValue when no scoped record exists." />
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
          isWrapped
          maxHeight={560}
        />
      </section>
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

function ReactShell() {
  return (
    <Band id="react">
      <section {...stylex.props(styles.referenceSplit)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="React" title="Shell UI is shared, app surfaces stay local.">
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
                detail: "TopNav, SideNav, command trigger, app navigation, and content outlet composition.",
              },
              {
                name: "ShellAppOutlet",
                tag: "Activation",
                tagVariant: "teal",
                detail: "Activates the app for a route and renders the active instance with workspace and navigation context.",
              },
              {
                name: "ShellCommandPalette",
                tag: "Palette",
                tagVariant: "purple",
                detail: "Searches, drills into child commands, executes handlers, and records recent actions.",
              },
              {
                name: "ShellPreferencesPanel",
                tag: "Settings",
                tagVariant: "green",
                detail: "Groups visible settings by ring and exposes resolved source details to users.",
              },
            ]}
          />
        </section>
        <CodeBlock
          title="react-hooks.ts"
          language="tsx"
          code={reactSnippet}
          width="100%"
          isWrapped
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
          <SectionHeader badge="Design system" title="Use Astryx primitives, then raise the composition with StyleX.">
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
          isWrapped
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
          <SectionHeader badge="CLI" title="Rails-like generators for stable framework seams.">
            The <Code>ak</Code> CLI creates the repeated extension points a
            shell product needs. It intentionally stops before product routing,
            Cloudflare binding configuration, migrations, and deployment policy.
          </SectionHeader>
          <section {...stylex.props(styles.actionRow)} aria-label="CLI actions">
            <Button
              label="Generator reference"
              href="#generators"
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
          isWrapped
          maxHeight={520}
        />
      </section>
    </Band>
  );
}

function Generators() {
  return (
    <Band id="generators" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="Generators" title="Generate the next correct file, not an entire product.">
            Generators create typed first drafts around framework concepts. The
            output is meant to be read, edited, committed, and owned by the host
            application.
          </SectionHeader>
          <section {...stylex.props(styles.notePanel)}>
            <Text as="p" display="block" color="secondary">
              Generated files are guarded by default. Use <Code>--dry-run</Code>
              to preview, <Code>--dir</Code> to choose an output root, and
              <Code>--force</Code> only when an overwrite is intentional.
            </Text>
          </section>
        </section>
        <SpecTable caption="Generator outputs" rows={generatorRows} />
      </section>
    </Band>
  );
}

function Workers() {
  return (
    <Band id="workers">
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="Workers" title="Worker helpers stay small so infrastructure stays honest.">
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
            isWrapped
            maxHeight={420}
          />
          <CodeBlock
            title="customer-repository.ts"
            language="ts"
            code={d1Snippet}
            width="100%"
            isWrapped
            maxHeight={560}
          />
        </aside>
      </section>
    </Band>
  );
}

function Reference() {
  return (
    <Band id="reference" muted>
      <section {...stylex.props(styles.guideGrid)}>
        <section {...stylex.props(styles.copyBlock)}>
          <SectionHeader badge="Reference" title="The public API mirrors product ownership boundaries.">
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
          <SectionHeader badge="Ship" title="What to verify before publishing a shell product.">
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
              title="Check UI composition"
              body="Verify no raw div elements or inline style props enter UI code, and inspect responsive docs screenshots."
            />
            <Step
              index="03"
              title="Re-check Cloudflare docs"
              body="Before changing Workers, D1, KV, R2, Durable Objects, Queues, Vectorize, Workers AI, or Agents SDK behavior, retrieve current product docs and limits."
            />
          </ol>
        </section>
        <CodeBlock
          title="release-checks.sh"
          language="bash"
          code={`npm run validate
npm run docs:screenshot
git status --short
gh run list --workflow Docs --limit 3`}
          width="100%"
          isWrapped
        />
      </section>
    </Band>
  );
}

function SpecTable({ caption, rows }: { caption: string; rows: SpecRow[] }) {
  return (
    <section {...stylex.props(styles.tableFrame)}>
      <Text type="label" weight="semibold" display="block" xstyle={styles.tableCaption}>
        {caption}
      </Text>
      <table {...stylex.props(styles.specTable)}>
        <thead>
          <tr {...stylex.props(styles.tableRow)}>
            <th {...stylex.props(styles.tableHead)}>Name</th>
            <th {...stylex.props(styles.tableHead)}>Scope</th>
            <th {...stylex.props(styles.tableHead)}>Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.name}:${row.tag}`} {...stylex.props(styles.tableRow)}>
              <td {...stylex.props(styles.tableCell, styles.tableNameCell)}>
                <Code>{row.name}</Code>
              </td>
              <td {...stylex.props(styles.tableCell)}>
                <Badge variant={row.tagVariant ?? "neutral"} label={row.tag} />
              </td>
              <td {...stylex.props(styles.tableCell)}>
                <Text as="p" display="block" color="secondary">
                  {row.detail}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

export function DocsApp() {
  return (
    <AstryxKitProvider appearance="system">
      <AppShell
        height="auto"
        variant="elevated"
        contentPadding={0}
        topNav={<TopNavigation />}
        sideNav={<SideNavigation />}>
        <DocsHero />
        <Install />
        <Quickstart />
        <FrameworkMap />
        <RuntimeLifecycle />
        <Commands />
        <Preferences />
        <ReactShell />
        <DesignSystem />
        <Cli />
        <Generators />
        <Workers />
        <Reference />
        <ShipChecklist />
      </AppShell>
    </AstryxKitProvider>
  );
}

const styles = stylex.create({
  heroBand: {
    backgroundColor: colorVars["--color-background-surface"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-12"],
    paddingInline: {
      default: spacingVars["--spacing-5"],
      "@media (min-width: 760px)": spacingVars["--spacing-8"],
    },
  },
  hero: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1080px)": "minmax(0, 1fr) minmax(420px, 0.82fr)",
    },
    marginInline: "auto",
    maxWidth: 1220,
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
    borderColor: colorVars["--color-border-emphasized"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-low"],
    minWidth: 0,
    overflow: "hidden",
  },
  systemHeader: {
    alignItems: "center",
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
    padding: spacingVars["--spacing-4"],
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
    padding: spacingVars["--spacing-4"],
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
  },
  bandMuted: {
    backgroundColor: colorVars["--color-background-body"],
  },
  bandInner: {
    display: "grid",
    gap: spacingVars["--spacing-6"],
    marginInline: "auto",
    maxWidth: 1220,
    width: "100%",
  },
  sectionHeader: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    maxWidth: 760,
  },
  installStrip: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 980px)": "minmax(0, 0.82fr) minmax(420px, 1fr)",
    },
  },
  guideGrid: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1080px)": "minmax(0, 0.9fr) minmax(440px, 1.1fr)",
    },
  },
  referenceSplit: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1080px)": "minmax(0, 1fr) minmax(420px, 0.88fr)",
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
  notePanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
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
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-4"],
    minHeight: 220,
    padding: spacingVars["--spacing-5"],
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
    borderRadius: radiusVars["--radius-element"],
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
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "auto minmax(0, 1fr)",
    padding: spacingVars["--spacing-4"],
  },
  stepIndex: {
    alignItems: "center",
    backgroundColor: colorVars["--color-accent"],
    borderRadius: radiusVars["--radius-element"],
    color: colorVars["--color-on-accent"],
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
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-1"],
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  interactivePanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border-emphasized"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
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
    backgroundColor: colorVars["--color-background-surface"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
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
    borderRadius: radiusVars["--radius-element"],
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
    backgroundColor: colorVars["--color-background-surface"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    listStyle: "none",
    padding: spacingVars["--spacing-4"],
  },
  decisionList: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
  },
  decisionItem: {
    alignItems: "start",
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
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
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    minWidth: 0,
    overflowX: "auto",
  },
  tableCaption: {
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    padding: spacingVars["--spacing-4"],
  },
  specTable: {
    borderCollapse: "collapse",
    minWidth: 680,
    width: "100%",
  },
  tableRow: {
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
  },
  tableHead: {
    color: colorVars["--color-text-secondary"],
    fontFamily: typographyVars["--font-family-body"],
    fontSize: textSizeVars["--font-size-sm"],
    fontWeight: fontWeightVars["--font-weight-semibold"],
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tableCell: {
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
    verticalAlign: "top",
  },
  tableNameCell: {
    whiteSpace: "nowrap",
  },
  linkPanel: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
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
