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
  radiusVars,
  shadowVars,
  spacingVars,
} from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { AstryxKitProvider } from "../../src/design-system";

type Tone = "blue" | "cyan" | "green" | "orange" | "purple" | "teal";

type Tile = {
  badge: BadgeVariant;
  body: string;
  code?: string;
  href?: string;
  icon: IconName;
  label: string;
  title: string;
  tone: Tone;
};

const productTiles: Tile[] = [
  {
    badge: "blue",
    body: "Register apps, commands, context keys, preference schemas, feature flags, and import maps from one runtime boundary.",
    code: "astryxkit/core",
    href: "#runtime",
    icon: "wrench",
    label: "Runtime",
    title: "Core shell runtime",
    tone: "blue",
  },
  {
    badge: "teal",
    body: "Render the platform frame, command palette, preferences panel, and active app outlet with Astryx-native surfaces.",
    code: "astryxkit/react",
    href: "#react",
    icon: "menu",
    label: "React",
    title: "Product shell UI",
    tone: "teal",
  },
  {
    badge: "purple",
    body: "Share theme defaults, appearance persistence, and component rules across every host product and micro-app.",
    code: "astryxkit/design-system",
    href: "#design-system",
    icon: "checkDouble",
    label: "Design",
    title: "Design-system wrapper",
    tone: "purple",
  },
  {
    badge: "green",
    body: "Compose explicit Worker routes, JSON responses, health checks, D1 access, and asset fallback without hiding bindings.",
    code: "astryxkit/worker",
    href: "#workers",
    icon: "info",
    label: "Workers",
    title: "Cloudflare boundary",
    tone: "green",
  },
];

const workflowTiles: Tile[] = [
  {
    badge: "blue",
    body: "Start with a host shell that owns navigation, workspace identity, and the app outlet.",
    code: "ak g shell Northstar",
    href: "#quickstart",
    icon: "menu",
    label: "1",
    title: "Create the shell",
    tone: "blue",
  },
  {
    badge: "teal",
    body: "Add a lazy micro-app manifest with commands, preferences, owner metadata, and a first render surface.",
    code: "ak g app Catalog",
    href: "#generators",
    icon: "viewColumns",
    label: "2",
    title: "Add a micro-app",
    tone: "teal",
  },
  {
    badge: "green",
    body: "Ship on Workers with explicit routes and data access helpers that keep infrastructure decisions visible.",
    code: "ak g worker-route catalog",
    href: "#workers",
    icon: "externalLink",
    label: "3",
    title: "Expose an API",
    tone: "green",
  },
];

const generatorTiles: Tile[] = [
  {
    badge: "blue",
    body: "Creates product-level ShellHost, provider, ShellFrame, and outlet wiring.",
    code: "src/shell",
    icon: "menu",
    label: "ak g shell <product>",
    title: "Shell",
    tone: "blue",
  },
  {
    badge: "teal",
    body: "Creates a manifest, activation function, default commands, starter preference, and view.",
    code: "src/apps",
    icon: "viewColumns",
    label: "ak g app <name>",
    title: "Micro-app",
    tone: "teal",
  },
  {
    badge: "purple",
    body: "Creates a CommandContribution and handler binder for app activation.",
    code: "src/commands",
    icon: "check",
    label: "ak g command <app>.<name>",
    title: "Command",
    tone: "purple",
  },
  {
    badge: "green",
    body: "Creates a PreferenceSchema ready to mount in a manifest settings surface.",
    code: "src/preferences",
    icon: "wrench",
    label: "ak g preference <app>.<name>",
    title: "Preference",
    tone: "green",
  },
  {
    badge: "orange",
    body: "Creates a WorkerRoute module around AstryxKit JSON helpers.",
    code: "src/worker/routes",
    icon: "externalLink",
    label: "ak g worker-route <name>",
    title: "Worker route",
    tone: "orange",
  },
  {
    badge: "cyan",
    body: "Creates a small typed D1 repository with binding lookup and prepared statements.",
    code: "src/worker/repositories",
    icon: "info",
    label: "ak g d1-repository <name>",
    title: "D1 repository",
    tone: "cyan",
  },
];

const referenceRows = [
  {
    badge: "Runtime",
    badgeVariant: "blue",
    body: "Owns app registration, activation, navigation, command routing, feature context, settings, and host events.",
    code: "ShellHost",
  },
  {
    badge: "Apps",
    badgeVariant: "teal",
    body: "Defines a micro-app's route, entry URL, commands, feature contributions, preferences, owner team, and lazy loader.",
    code: "ShellAppManifest",
  },
  {
    badge: "React",
    badgeVariant: "purple",
    body: "Provides the top-level product frame and active app outlet with command palette and preferences integration.",
    code: "ShellFrame",
  },
  {
    badge: "Workers",
    badgeVariant: "green",
    body: "Builds a compact Worker fetch handler from explicit routes, health checks, asset fallback, and JSON errors.",
    code: "createWorkerRouter",
  },
] satisfies Array<{
  badge: string;
  badgeVariant: BadgeVariant;
  body: string;
  code: string;
}>;

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

const appSnippet = `host.register({
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
    },
  ],
  load: () => import("@app/catalog"),
});`;

const workerSnippet = `import { createWorkerRouter, json } from "astryxkit/worker";

export default {
  fetch: createWorkerRouter({
    health: { name: "catalog-api" },
    routes: [
      {
        method: "GET",
        pathname: "/api/catalog",
        handle: async () =>
          json({ items: [], generatedAt: new Date().toISOString() }),
      },
    ],
  }),
};`;

const cliSnippet = `ak generators
ak g shell Northstar
ak g app Catalog
ak g command catalog.refresh
ak g preference catalog.density
ak g worker-route catalog
ak g d1-repository customer`;

function TopNavigation() {
  return (
    <TopNav
      label="AstryxKit documentation"
      heading={
        <TopNavHeading
          logo={<Icon icon="wrench" color="accent" />}
          heading="AstryxKit"
          subheading="Docs"
          headingHref="#overview"
        />
      }
      startContent={
        <>
          <TopNavItem label="Overview" href="#overview" isSelected />
          <TopNavItem label="Quickstart" href="#quickstart" />
          <TopNavItem label="CLI" href="#cli" />
          <TopNavItem label="Reference" href="#reference" />
          <TopNavItem label="Workers" href="#workers" />
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
        <SideNavItem label="Quickstart" href="#quickstart" icon="check" />
        <SideNavItem label="CLI" href="#cli" icon="menu" />
      </SideNavSection>
      <SideNavSection title="Build">
        <SideNavItem label="Runtime" href="#runtime" icon="wrench" />
        <SideNavItem label="React shell" href="#react" icon="viewColumns" />
        <SideNavItem label="Design system" href="#design-system" icon="checkDouble" />
        <SideNavItem label="Workers" href="#workers" icon="externalLink" />
      </SideNavSection>
      <SideNavSection title="Reference">
        <SideNavItem label="Generators" href="#generators" icon="menu" />
        <SideNavItem label="API reference" href="#reference" icon="viewColumns" />
        <SideNavItem
          label="GitHub"
          href="https://github.com/thedjpetersen/astryxkit"
          icon="externalLink"
        />
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
            <Badge variant="blue" label="Micro-app shell" />
            <Badge variant="teal" label="Astryx design system" />
            <Badge variant="green" label="Cloudflare Workers" />
          </HStack>
          <VStack gap={4}>
            <Heading level={1} type="display-2" id="hero-title">
              Infrastructure-grade docs for building AstryxKit products.
            </Heading>
            <Text as="p" type="large" display="block" color="secondary">
              Compose host shells, register micro-apps, wire command palette
              actions, and ship Worker APIs from one focused framework.
            </Text>
          </VStack>
          <HStack gap={2} wrap="wrap">
            <Button
              label="Start building"
              href="#quickstart"
              variant="primary"
              icon={<Icon icon="chevronRight" size="sm" />}
            />
            <Button
              label="View generators"
              href="#generators"
              variant="secondary"
              icon={<Icon icon="menu" size="sm" />}
            />
            <Button
              label="Open GitHub"
              href="https://github.com/thedjpetersen/astryxkit"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              icon={<Icon icon="externalLink" size="sm" />}
            />
          </HStack>
        </section>

        <aside {...stylex.props(styles.heroPreview)} aria-label="Quickstart preview">
          <header {...stylex.props(styles.previewHeader)}>
            <HStack gap={1.5} align="center">
              <span {...stylex.props(styles.statusDot, styles.statusBlue)} />
              <span {...stylex.props(styles.statusDot, styles.statusTeal)} />
              <span {...stylex.props(styles.statusDot, styles.statusGreen)} />
            </HStack>
            <Text type="supporting" color="secondary">
              ak quickstart
            </Text>
          </header>
          <CodeBlock
            title="terminal"
            language="bash"
            code={`npm install astryxkit
ak g shell Northstar
ak g app Catalog
ak g worker-route catalog`}
            width="100%"
            container="section"
            isWrapped
          />
          <section {...stylex.props(styles.previewFooter)}>
            <Metric label="generators" value="6" tone="blue" />
            <Metric label="exports" value="4" tone="teal" />
            <Metric label="tests" value="22" tone="green" />
          </section>
        </aside>
      </article>
    </section>
  );
}

function Metric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: Tone;
  value: string;
}) {
  return (
    <article {...stylex.props(styles.metric, toneStyle(tone))}>
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
  children: React.ReactNode;
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

function TileGrid({ children }: { children: ReactNode }) {
  return <section {...stylex.props(styles.tileGrid)}>{children}</section>;
}

function FeatureTile({ tile }: { tile: Tile }) {
  return (
    <article {...stylex.props(styles.tile, toneStyle(tile.tone))}>
      <header {...stylex.props(styles.tileHeader)}>
        <span {...stylex.props(styles.iconFrame)}>
          <Icon icon={tile.icon} size="sm" color="primary" />
        </span>
        <Badge variant={tile.badge} label={tile.label} />
      </header>
      <VStack gap={2}>
        <Heading level={3}>{tile.title}</Heading>
        <Text as="p" display="block" color="secondary">
          {tile.body}
        </Text>
      </VStack>
      {tile.code ? (
        <Text as="p" display="block" type="label">
          <Code>{tile.code}</Code>
        </Text>
      ) : null}
      {tile.href ? (
        <Link href={tile.href} isStandalone>
          Read more
        </Link>
      ) : null}
    </article>
  );
}

function Quickstart() {
  return (
    <Band id="quickstart" muted>
      <section {...stylex.props(styles.split)}>
        <section>
          <SectionHeader badge="Quickstart" title="Move from package install to shell composition.">
            A Stripe-like docs path should answer what to install, what to
            create, and where the integration boundaries live.
          </SectionHeader>
          <ol {...stylex.props(styles.stepList)}>
            {workflowTiles.map((tile) => (
              <li key={tile.title} {...stylex.props(styles.stepItem)}>
                <FeatureTile tile={tile} />
              </li>
            ))}
          </ol>
        </section>
        <aside {...stylex.props(styles.codeStack)} aria-label="Install command">
          <CodeBlock
            title="Install"
            language="bash"
            code={installSnippet}
            width="100%"
            isWrapped
          />
          <CodeBlock
            title="Host shell"
            language="tsx"
            code={shellSnippet}
            width="100%"
            isWrapped
            maxHeight={520}
          />
        </aside>
      </section>
    </Band>
  );
}

function BuildSurface() {
  return (
    <Band id="runtime">
      <SectionHeader badge="Products" title="Browse by framework surface.">
        AstryxKit is organized like a product platform: runtime, React shell,
        design system, and Worker API boundary.
      </SectionHeader>
      <TileGrid>
        {productTiles.map((tile) => (
          <FeatureTile key={tile.title} tile={tile} />
        ))}
      </TileGrid>
    </Band>
  );
}

function ReactAndDesign() {
  return (
    <Band id="react" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section>
          <SectionHeader badge="React" title="Shell UI and design-system contract.">
            The React layer is where product teams feel the framework: the
            navigation frame, command palette, preferences, outlet, and shared
            theme provider.
          </SectionHeader>
          <section id="design-system" {...stylex.props(styles.callout)}>
            <HStack gap={2} align="center" wrap="wrap">
              <Icon icon="checkDouble" color="accent" />
              <Badge variant="purple" label="Design system" />
            </HStack>
            <Text as="p" display="block" color="secondary">
              Wrap products in <Code>AstryxKitProvider</Code> to share the
              default AstryxKit theme and appearance-mode persistence. Use
              Astryx primitives for controls, then raise the page composition
              with StyleX-authored documentation components.
            </Text>
          </section>
        </section>
        <CodeBlock
          title="Micro-app manifest"
          language="ts"
          code={appSnippet}
          width="100%"
          isWrapped
          maxHeight={640}
        />
      </section>
    </Band>
  );
}

function CliReference() {
  return (
    <Band id="cli">
      <section {...stylex.props(styles.split)}>
        <section>
          <SectionHeader badge="CLI" title="Rails-like generators for framework seams.">
            The <Code>ak</Code> CLI scaffolds the repeated files that every
            AstryxKit host product eventually needs.
          </SectionHeader>
          <section {...stylex.props(styles.inlineActions)}>
            <Button
              label="Generator reference"
              href="#generators"
              variant="primary"
              icon={<Icon icon="chevronRight" size="sm" />}
            />
            <Button
              label="Source"
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
          code={cliSnippet}
          width="100%"
          isWrapped
        />
      </section>
    </Band>
  );
}

function Generators() {
  return (
    <Band id="generators" muted>
      <SectionHeader badge="Generators" title="Generate the next correct file.">
        Generators are deliberately scoped to stable framework concepts. They
        do not hide Cloudflare bindings, migrations, or product routing.
      </SectionHeader>
      <TileGrid>
        {generatorTiles.map((tile) => (
          <FeatureTile key={tile.label} tile={tile} />
        ))}
      </TileGrid>
    </Band>
  );
}

function Reference() {
  return (
    <Band id="reference">
      <section {...stylex.props(styles.referenceSplit)}>
        <section>
          <SectionHeader badge="Reference" title="Core concepts stay small and explicit.">
            The public API is split around the same boundaries a production
            team already thinks about: platform runtime, app modules, React UI,
            and Worker APIs.
          </SectionHeader>
          <section {...stylex.props(styles.referenceRows)}>
            {referenceRows.map((row) => (
              <article key={row.code} {...stylex.props(styles.referenceRow)}>
                <HStack gap={2} align="center" wrap="wrap">
                  <Badge variant={row.badgeVariant} label={row.badge} />
                  <Code>{row.code}</Code>
                </HStack>
                <Text as="p" display="block" color="secondary">
                  {row.body}
                </Text>
              </article>
            ))}
          </section>
        </section>
        <aside {...stylex.props(styles.callout)} aria-label="Documentation links">
          <VStack gap={3}>
            <Heading level={3}>Read the design notes</Heading>
            <Text as="p" display="block" color="secondary">
              The repository includes deeper notes on architecture, design
              system usage, Cloudflare constraints, and generator rationale.
            </Text>
            <VStack gap={2}>
              <Link href="https://github.com/thedjpetersen/astryxkit/blob/main/docs/architecture.md" isStandalone>
                Architecture
              </Link>
              <Link href="https://github.com/thedjpetersen/astryxkit/blob/main/docs/design-system.md" isStandalone>
                Design system
              </Link>
              <Link href="https://github.com/thedjpetersen/astryxkit/blob/main/docs/generators.md" isStandalone>
                Generators
              </Link>
            </VStack>
          </VStack>
        </aside>
      </section>
    </Band>
  );
}

function Workers() {
  return (
    <Band id="workers" muted>
      <section {...stylex.props(styles.referenceSplit)}>
        <section>
          <SectionHeader badge="Cloudflare" title="Workers APIs without hidden infrastructure.">
            AstryxKit keeps Worker helpers compact so host apps own bindings,
            quotas, schemas, migrations, and deployment topology.
          </SectionHeader>
          <section {...stylex.props(styles.inlineActions)}>
            <Button
              label="Workers docs"
              href="https://developers.cloudflare.com/workers/"
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              icon={<Icon icon="externalLink" size="sm" />}
            />
            <Button
              label="Workers limits"
              href="https://developers.cloudflare.com/workers/platform/limits/"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              icon={<Icon icon="externalLink" size="sm" />}
            />
            <Button
              label="D1 docs"
              href="https://developers.cloudflare.com/d1/"
              target="_blank"
              rel="noreferrer"
              variant="ghost"
              icon={<Icon icon="externalLink" size="sm" />}
            />
          </section>
          <Text as="p" display="block" color="secondary">
            Current Cloudflare docs should be checked before changing Workers,
            D1, KV, R2, Durable Objects, Queues, Vectorize, Workers AI, or
            Agents SDK behavior.
          </Text>
        </section>
        <CodeBlock
          title="worker.ts"
          language="ts"
          code={workerSnippet}
          width="100%"
          isWrapped
          maxHeight={520}
        />
      </section>
    </Band>
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
        <Band id="install">
          <section {...stylex.props(styles.installStrip)}>
            <VStack gap={1}>
              <Heading level={2}>Install once, build across products.</Heading>
              <Text as="p" display="block" color="secondary">
                React, Astryx Core, and StyleX stay peer dependencies so the
                host app owns its UI runtime.
              </Text>
            </VStack>
            <CodeBlock
              title="npm"
              language="bash"
              code={installSnippet}
              width="100%"
              isWrapped
            />
          </section>
        </Band>
        <Quickstart />
        <BuildSurface />
        <ReactAndDesign />
        <CliReference />
        <Generators />
        <Reference />
        <Workers />
      </AppShell>
    </AstryxKitProvider>
  );
}

function toneStyle(tone: Tone) {
  return {
    blue: styles.toneBlue,
    cyan: styles.toneCyan,
    green: styles.toneGreen,
    orange: styles.toneOrange,
    purple: styles.tonePurple,
    teal: styles.toneTeal,
  }[tone];
}

const styles = stylex.create({
  heroBand: {
    backgroundColor: colorVars["--color-background-surface"],
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    paddingBlock: spacingVars["--spacing-10"],
    paddingInline: spacingVars["--spacing-8"],
  },
  hero: {
    display: "grid",
    gap: spacingVars["--spacing-10"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1060px)": "minmax(0, 1.04fr) minmax(380px, 0.96fr)",
    },
    marginInline: "auto",
    maxWidth: 1180,
    width: "100%",
  },
  heroCopy: {
    alignContent: "center",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    minWidth: 0,
  },
  heroPreview: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    boxShadow: shadowVars["--shadow-med"],
    minWidth: 0,
    overflow: "hidden",
  },
  previewHeader: {
    alignItems: "center",
    borderBottomColor: colorVars["--color-border"],
    borderBottomStyle: "solid",
    borderBottomWidth: borderVars["--border-width"],
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: spacingVars["--spacing-3"],
    paddingInline: spacingVars["--spacing-4"],
  },
  previewFooter: {
    borderTopColor: colorVars["--color-border"],
    borderTopStyle: "solid",
    borderTopWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    padding: spacingVars["--spacing-4"],
  },
  statusDot: {
    borderRadius: radiusVars["--radius-full"],
    display: "inline-block",
    height: spacingVars["--spacing-2"],
    width: spacingVars["--spacing-2"],
  },
  statusBlue: {
    backgroundColor: colorVars["--color-icon-blue"],
  },
  statusTeal: {
    backgroundColor: colorVars["--color-icon-teal"],
  },
  statusGreen: {
    backgroundColor: colorVars["--color-icon-green"],
  },
  metric: {
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    padding: spacingVars["--spacing-3"],
  },
  band: {
    backgroundColor: colorVars["--color-background-surface"],
    paddingBlock: spacingVars["--spacing-10"],
    paddingInline: spacingVars["--spacing-8"],
  },
  bandMuted: {
    backgroundColor: colorVars["--color-background-body"],
  },
  bandInner: {
    display: "grid",
    gap: spacingVars["--spacing-6"],
    marginInline: "auto",
    maxWidth: 1180,
    width: "100%",
  },
  sectionHeader: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-3"],
    justifyItems: "start",
    maxWidth: 760,
  },
  tileGrid: {
    display: "grid",
    gap: spacingVars["--spacing-4"],
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  },
  tile: {
    alignContent: "start",
    backgroundColor: colorVars["--color-background-card"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-4"],
    minHeight: 240,
    padding: spacingVars["--spacing-5"],
  },
  tileHeader: {
    alignItems: "center",
    display: "flex",
    gap: spacingVars["--spacing-2"],
    justifyContent: "space-between",
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colorVars["--color-background-muted"],
    borderRadius: radiusVars["--radius-element"],
    display: "inline-flex",
    height: spacingVars["--spacing-8"],
    justifyContent: "center",
    width: spacingVars["--spacing-8"],
  },
  split: {
    display: "grid",
    gap: spacingVars["--spacing-6"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1080px)": "minmax(0, 0.82fr) minmax(420px, 1.18fr)",
    },
  },
  referenceSplit: {
    alignItems: "start",
    display: "grid",
    gap: spacingVars["--spacing-6"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1040px)": "minmax(0, 1fr) minmax(360px, 0.72fr)",
    },
  },
  codeStack: {
    display: "grid",
    gap: spacingVars["--spacing-4"],
    minWidth: 0,
  },
  stepList: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  stepItem: {
    minWidth: 0,
  },
  inlineActions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
    marginBlockStart: spacingVars["--spacing-5"],
  },
  installStrip: {
    display: "grid",
    gap: spacingVars["--spacing-5"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1020px)": "minmax(0, 0.72fr) minmax(420px, 1fr)",
    },
  },
  callout: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    padding: spacingVars["--spacing-5"],
  },
  referenceRows: {
    display: "grid",
    gap: spacingVars["--spacing-3"],
  },
  referenceRow: {
    backgroundColor: colorVars["--color-background-card"],
    borderColor: colorVars["--color-border"],
    borderRadius: radiusVars["--radius-element"],
    borderStyle: "solid",
    borderWidth: borderVars["--border-width"],
    display: "grid",
    gap: spacingVars["--spacing-3"],
    padding: spacingVars["--spacing-4"],
  },
  toneBlue: {
    backgroundColor: colorVars["--color-background-blue"],
    borderColor: colorVars["--color-border-blue"],
  },
  toneCyan: {
    backgroundColor: colorVars["--color-background-cyan"],
    borderColor: colorVars["--color-border-cyan"],
  },
  toneGreen: {
    backgroundColor: colorVars["--color-background-green"],
    borderColor: colorVars["--color-border-green"],
  },
  toneOrange: {
    backgroundColor: colorVars["--color-background-orange"],
    borderColor: colorVars["--color-border-orange"],
  },
  tonePurple: {
    backgroundColor: colorVars["--color-background-purple"],
    borderColor: colorVars["--color-border-purple"],
  },
  toneTeal: {
    backgroundColor: colorVars["--color-background-teal"],
    borderColor: colorVars["--color-border-teal"],
  },
});
